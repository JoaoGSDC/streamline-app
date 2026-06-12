import { getTwitchOAuthRedirectUri } from "@server/auth/twitch-oauth.service";
import { getTwitchClientId } from "@server/shared/twitch-oauth.client";
import { createRandomString } from "@utils/factories/create-random-string";
import { STREAMER_BOT_OAUTH_SCOPES } from "./bot-twitch-oauth.constants";
import type { TwitchOAuthTokenResponse } from "@server/auth/twitch-oauth.types";

const TWITCH_AUTHORIZE_URL = "https://id.twitch.tv/oauth2/authorize";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

/** Mesmo redirect do login — já cadastrado no app Twitch. */
function getBotOAuthRedirectUri(): string {
  return getTwitchOAuthRedirectUri();
}

function getOAuthCredentials() {
  const clientId =
    process.env.TWITCH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ||
    "";
  const clientSecret =
    process.env.TWITCH_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET ||
    "";

  if (!clientId || !clientSecret) {
    throw new Error("Missing Twitch OAuth credentials");
  }

  return { clientId, clientSecret, redirectUri: getBotOAuthRedirectUri() };
}

export function createBotOAuthState(): string {
  return createRandomString(32);
}

export function buildBotTwitchAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: STREAMER_BOT_OAUTH_SCOPES.join(" "),
    state,
    force_verify: "true",
  });

  return `${TWITCH_AUTHORIZE_URL}?${params.toString()}`;
}

export function normalizeOAuthScopes(
  scope: string | string[] | undefined
): string[] {
  if (!scope) return [];
  if (Array.isArray(scope)) return scope.filter(Boolean);
  return scope.split(" ").map((item) => item.trim()).filter(Boolean);
}

export async function exchangeBotAuthorizationCode(
  code: string
): Promise<TwitchOAuthTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthCredentials();

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to exchange bot Twitch authorization code (${response.status})`
    );
  }

  return response.json();
}

export async function fetchBotOAuthUser(accessToken: string) {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": getTwitchClientId(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bot OAuth Twitch user (${response.status})`);
  }

  const payload = await response.json();
  const rawUser = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (!rawUser?.id) return null;

  return {
    id: String(rawUser.id),
    login: String(rawUser.login ?? "").toLowerCase(),
    displayName: String(rawUser.display_name ?? rawUser.login ?? ""),
  };
}
