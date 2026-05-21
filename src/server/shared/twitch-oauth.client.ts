const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export function getTwitchCredentials() {
  const clientId =
    process.env.TWITCH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ||
    "";
  const clientSecret =
    process.env.TWITCH_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET ||
    "";

  if (!clientId || !clientSecret) {
    throw new Error("Missing Twitch client credentials");
  }

  return { clientId, clientSecret };
}

async function fetchAppToken(): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getTwitchCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain Twitch app token (${response.status})`);
  }

  return response.json();
}

export async function ensureTwitchAppAccessToken(
  forceRefresh = false
): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const { access_token, expires_in } = await fetchAppToken();
  cachedToken = access_token;
  tokenExpiresAt = now + expires_in * 1000;
  return cachedToken;
}

export function getTwitchClientId(): string {
  return getTwitchCredentials().clientId;
}
