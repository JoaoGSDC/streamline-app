import { getTwitchClientId } from "@server/shared/twitch-oauth.client";
import { createRandomString } from "@utils/factories/create-random-string";
import type {
  TwitchOAuthConfig,
  TwitchOAuthTokenResponse,
  TwitchOAuthUserDto,
} from "./twitch-oauth.types";

const TWITCH_AUTHORIZE_URL = "https://id.twitch.tv/oauth2/authorize";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_HELIX_USERS = "https://api.twitch.tv/helix/users";

function getOAuthConfig(): TwitchOAuthConfig {
  const clientId =
    process.env.TWITCH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ||
    "";
  const clientSecret =
    process.env.TWITCH_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET ||
    "";
  const redirectUri =
    process.env.TWITCH_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI ||
    "http://localhost:3000/api/auth/twitch/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Missing Twitch OAuth credentials");
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildTwitchAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user:read:email",
    state,
  });

  return `${TWITCH_AUTHORIZE_URL}?${params.toString()}`;
}

export function createOAuthState(): string {
  return createRandomString(32);
}

export async function exchangeAuthorizationCode(
  code: string
): Promise<TwitchOAuthTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

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
    throw new Error(`Failed to exchange Twitch authorization code (${response.status})`);
  }

  return response.json();
}

interface HelixOAuthUserRaw {
  id?: string;
  login?: string;
  display_name?: string;
  broadcaster_type?: string;
  description?: string;
  profile_image_url?: string;
  view_count?: number;
  created_at?: string;
}

export async function fetchOAuthUser(
  accessToken: string
): Promise<TwitchOAuthUserDto | null> {
  const response = await fetch(TWITCH_HELIX_USERS, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": getTwitchClientId(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Twitch OAuth user (${response.status})`);
  }

  const payload = await response.json();
  const rawUser = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (!rawUser) return null;

  return mapOAuthUser(rawUser as HelixOAuthUserRaw);
}

function mapOAuthUser(user: HelixOAuthUserRaw): TwitchOAuthUserDto {
  return {
    id: String(user.id ?? ""),
    login: String(user.login ?? "").toLowerCase(),
    displayName: String(user.display_name ?? user.login ?? ""),
    broadcasterType: String(user.broadcaster_type ?? ""),
    description: String(user.description ?? ""),
    profileImageUrl: String(user.profile_image_url ?? ""),
    viewCount: Number(user.view_count ?? 0),
    createdAt: String(user.created_at ?? ""),
  };
}
