import { NextRequest, NextResponse } from "next/server";
import { handleBotTwitchOAuthCallbackController } from "@api/internal/bot/bot-oauth.controller";
import { upsertStreamerFromTwitch } from "@lib/db-queries";
import { TWITCH_BOT_OAUTH_STATE_COOKIE } from "@server/bot/bot-twitch-oauth.constants";
import {
  buildTwitchAuthorizeUrl,
  createOAuthState,
  exchangeAuthorizationCode,
  fetchOAuthUser,
} from "@server/auth/twitch-oauth.service";
import {
  ADMIN_ACTING_AS_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  TWITCH_OAUTH_STATE_COOKIE,
  TWITCH_SESSION_COOKIE,
} from "@server/auth/session.constants";
import type { TwitchSessionUser } from "@/types/auth";
import { handleRouteError, jsonSuccess } from "@api/shared/api-response";

export async function getTwitchAuthorizeUrlController() {
  try {
    const oauthState = createOAuthState();
    const authorizeUrl = buildTwitchAuthorizeUrl(oauthState);

    const response = jsonSuccess({ url: authorizeUrl });
    response.cookies.set(TWITCH_OAUTH_STATE_COOKIE, oauthState, {
      maxAge: 600,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return handleRouteError(error, "Falha ao iniciar autenticação Twitch");
  }
}

function buildSessionPayload(
  twitchUser: Awaited<ReturnType<typeof fetchOAuthUser>>,
  accessToken: string,
  dbStreamer: Awaited<ReturnType<typeof upsertStreamerFromTwitch>>
): TwitchSessionUser {
  if (!twitchUser) {
    throw new Error("Twitch user not found");
  }

  return {
    id: twitchUser.id,
    name: twitchUser.displayName || twitchUser.login,
    twitchUsername: twitchUser.login,
    avatar: twitchUser.profileImageUrl,
    bio: twitchUser.description,
    twitchUrl: `https://twitch.tv/${twitchUser.login}`,
    followers: twitchUser.viewCount.toString(),
    accessToken,
    broadcasterType: twitchUser.broadcasterType,
    partner: dbStreamer?.partner ?? false,
    premium: dbStreamer?.premium ?? false,
    createdAt: twitchUser.createdAt,
  };
}

export async function handleTwitchOAuthCallbackController(
  request: NextRequest
) {
  const botOAuthState = request.cookies.get(TWITCH_BOT_OAUTH_STATE_COOKIE)?.value;
  if (botOAuthState) {
    return handleBotTwitchOAuthCallbackController(request);
  }

  const searchParams = request.nextUrl.searchParams;
  const oauthError = searchParams.get("error");
  const authorizationCode = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const storedState = request.cookies.get(TWITCH_OAUTH_STATE_COOKIE)?.value;

  if (oauthError) {
    return NextResponse.redirect(new URL("/auth?error=access_denied", request.url));
  }

  if (!authorizationCode) {
    return NextResponse.redirect(new URL("/auth?error=no_code", request.url));
  }

  if (!returnedState || !storedState || returnedState !== storedState) {
    return NextResponse.redirect(new URL("/auth?error=invalid_state", request.url));
  }

  try {
    const tokenResponse = await exchangeAuthorizationCode(authorizationCode);
    const twitchUser = await fetchOAuthUser(tokenResponse.access_token);

    if (!twitchUser) {
      return NextResponse.redirect(new URL("/auth?error=no_user", request.url));
    }

    const dbStreamer = await upsertStreamerFromTwitch({
      id: twitchUser.id,
      twitchId: twitchUser.id,
      name: twitchUser.displayName || twitchUser.login,
      twitchUsername: twitchUser.login,
      avatar: twitchUser.profileImageUrl,
      bio: twitchUser.description,
      twitchUrl: `https://twitch.tv/${twitchUser.login}`,
      followers: twitchUser.viewCount.toString(),
    });

    const sessionPayload = buildSessionPayload(
      twitchUser,
      tokenResponse.access_token,
      dbStreamer
    );

    const response = NextResponse.redirect(new URL("/admin", request.url));

    response.cookies.set(TWITCH_SESSION_COOKIE, JSON.stringify(sessionPayload), {
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    response.cookies.delete(TWITCH_OAUTH_STATE_COOKIE);

    return response;
  } catch (callbackError) {
    console.error("Auth callback error:", callbackError);
    return NextResponse.redirect(
      new URL("/auth?error=callback_error", request.url)
    );
  }
}
