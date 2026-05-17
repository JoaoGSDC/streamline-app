import { API_ENDPOINTS } from "@/constants";

export interface TwitchChannelResult {
  id: string;
  login: string;
  displayName: string;
  thumbnailUrl: string;
  isLive: boolean;
  gameName: string;
}

function getTwitchCredentials() {
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

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchTwitchAppToken(): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getTwitchCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(API_ENDPOINTS.TWITCH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain Twitch app token (${res.status})`);
  }

  return res.json();
}

export async function ensureTwitchAppToken(
  forceRefresh = false
): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const { access_token, expires_in } = await fetchTwitchAppToken();
  cachedToken = access_token;
  tokenExpiresAt = now + expires_in * 1000;
  return cachedToken;
}

export async function searchTwitchChannels(
  query: string,
  limit = 10,
  retried = false
): Promise<TwitchChannelResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { clientId } = getTwitchCredentials();
  const token = await ensureTwitchAppToken();
  const params = new URLSearchParams({
    query: trimmed,
    first: String(Math.min(Math.max(limit, 1), 100)),
  });

  const res = await fetch(
    `https://api.twitch.tv/helix/search/channels?${params}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    }
  );

  if (res.status === 401 && !retried) {
    await ensureTwitchAppToken(true);
    return searchTwitchChannels(query, limit, true);
  }

  if (!res.ok) {
    throw new Error(`Twitch search/channels failed (${res.status})`);
  }

  const data = await res.json();
  const channels = Array.isArray(data?.data) ? data.data : [];

  return channels.map((channel: Record<string, unknown>) => ({
    id: String(channel.id ?? ""),
    login: String(channel.broadcaster_login ?? "").toLowerCase(),
    displayName: String(
      channel.display_name ?? channel.broadcaster_name ?? channel.broadcaster_login ?? ""
    ),
    thumbnailUrl: String(channel.thumbnail_url ?? "").replace(
      /-\{width\}x\{height\}/,
      "-70x70"
    ),
    isLive: Boolean(channel.is_live),
    gameName: String(channel.game_name ?? ""),
  }));
}
