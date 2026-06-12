import { NextRequest, NextResponse } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";
import { getStreamerById } from "@lib/db-queries";
import {
  upsertStreamerTwitchOAuth,
} from "@lib/streamer-oauth-db-queries";
import {
  TWITCH_BOT_OAUTH_STATE_COOKIE,
  TWITCH_BOT_OAUTH_STREAMER_COOKIE,
} from "@server/bot/bot-twitch-oauth.constants";
import {
  buildBotTwitchAuthorizeUrl,
  createBotOAuthState,
  exchangeBotAuthorizationCode,
  fetchBotOAuthUser,
  normalizeOAuthScopes,
} from "@server/bot/bot-twitch-oauth.service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function getBotTwitchOAuthAuthorizeController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const streamer = await getStreamerById(resolved.streamerId);
    if (!streamer) {
      return jsonError("Streamer não encontrado", 404, "NOT_FOUND");
    }

    const oauthState = createBotOAuthState();
    const authorizeUrl = buildBotTwitchAuthorizeUrl(oauthState);

    const wantsJson =
      request.nextUrl.searchParams.get("format") === "json" ||
      (request.headers.get("accept") ?? "").includes("application/json");

    const response = wantsJson
      ? jsonSuccess({ url: authorizeUrl })
      : NextResponse.redirect(authorizeUrl);

    response.cookies.set(TWITCH_BOT_OAUTH_STATE_COOKIE, oauthState, {
      maxAge: 600,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    response.cookies.set(TWITCH_BOT_OAUTH_STREAMER_COOKIE, resolved.streamerId, {
      maxAge: 600,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return handleRouteError(error, "Falha ao iniciar OAuth do bot");
  }
}

export async function handleBotTwitchOAuthCallbackController(
  request: NextRequest
) {
  const adminBotUrl = new URL("/admin/bot", request.url);
  const searchParams = request.nextUrl.searchParams;
  const oauthError = searchParams.get("error");
  const authorizationCode = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const storedState = request.cookies.get(TWITCH_BOT_OAUTH_STATE_COOKIE)?.value;
  const streamerId = request.cookies.get(TWITCH_BOT_OAUTH_STREAMER_COOKIE)?.value;

  const redirectWithError = (code: string) => {
    adminBotUrl.searchParams.set("oauth", code);
    const response = NextResponse.redirect(adminBotUrl);
    response.cookies.delete(TWITCH_BOT_OAUTH_STATE_COOKIE);
    response.cookies.delete(TWITCH_BOT_OAUTH_STREAMER_COOKIE);
    return response;
  };

  if (oauthError) {
    const errorCode =
      oauthError === "access_denied"
        ? "denied"
        : oauthError === "redirect_mismatch"
          ? "redirect_mismatch"
          : `twitch_${oauthError}`;
    return redirectWithError(errorCode);
  }

  if (!authorizationCode || !streamerId) {
    return redirectWithError("no_code");
  }

  if (!returnedState || !storedState || returnedState !== storedState) {
    return redirectWithError("invalid_state");
  }

  try {
    const streamer = await getStreamerById(streamerId);
    if (!streamer) {
      return redirectWithError("streamer_not_found");
    }

    const tokenResponse = await exchangeBotAuthorizationCode(authorizationCode);
    if (!tokenResponse.refresh_token?.trim()) {
      return redirectWithError("no_refresh_token");
    }

    const twitchUser = await fetchBotOAuthUser(tokenResponse.access_token);
    if (!twitchUser) {
      return redirectWithError("no_user");
    }

    if (twitchUser.id !== streamer.twitchId) {
      return redirectWithError("account_mismatch");
    }

    const scopes = normalizeOAuthScopes(tokenResponse.scope);

    await upsertStreamerTwitchOAuth({
      streamerId,
      refreshToken: tokenResponse.refresh_token,
      scopes,
      twitchUserId: twitchUser.id,
    });

    adminBotUrl.searchParams.set("oauth", "connected");
    const response = NextResponse.redirect(adminBotUrl);
    response.cookies.delete(TWITCH_BOT_OAUTH_STATE_COOKIE);
    response.cookies.delete(TWITCH_BOT_OAUTH_STREAMER_COOKIE);
    return response;
  } catch (callbackError) {
    console.error("Bot OAuth callback error:", callbackError);
    return redirectWithError("callback_error");
  }
}
