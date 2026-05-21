import {
  ensureTwitchAppAccessToken,
  getTwitchClientId,
} from "@server/shared/twitch-oauth.client";
import type {
  TwitchHelixChannelRaw,
  TwitchHelixStreamRaw,
  TwitchHelixUserRaw,
} from "./twitch.types";

const TWITCH_HELIX_BASE = "https://api.twitch.tv/helix";

interface HelixListResponse<T> {
  data?: T[];
}

async function helixFetch<T>(
  path: string,
  searchParams: URLSearchParams,
  retried = false
): Promise<HelixListResponse<T>> {
  const token = await ensureTwitchAppAccessToken();
  const clientId = getTwitchClientId();
  const url = `${TWITCH_HELIX_BASE}${path}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (response.status === 401 && !retried) {
    await ensureTwitchAppAccessToken(true);
    return helixFetch(path, searchParams, true);
  }

  if (!response.ok) {
    throw new Error(`Twitch Helix request failed (${response.status}): ${path}`);
  }

  return response.json();
}

export async function fetchSearchChannels(
  query: string,
  limit: number
): Promise<TwitchHelixChannelRaw[]> {
  const params = new URLSearchParams({
    query,
    first: String(limit),
  });
  const payload = await helixFetch<TwitchHelixChannelRaw>(
    "/search/channels",
    params
  );
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function fetchUserByLogin(
  login: string
): Promise<TwitchHelixUserRaw | null> {
  const params = new URLSearchParams({ login });
  const payload = await helixFetch<TwitchHelixUserRaw>("/users", params);
  if (!Array.isArray(payload.data) || payload.data.length === 0) return null;
  return payload.data[0];
}

export async function fetchLiveStreamsByLogins(
  logins: string[]
): Promise<TwitchHelixStreamRaw[]> {
  const params = new URLSearchParams();
  for (const login of logins) {
    params.append("user_login", login);
  }

  const response = await fetch(`${TWITCH_HELIX_BASE}/streams?${params}`, {
    headers: {
      "Client-ID": getTwitchClientId(),
      Authorization: `Bearer ${await ensureTwitchAppAccessToken()}`,
    },
    next: { revalidate: 60 },
  });

  if (response.status === 401) {
    await ensureTwitchAppAccessToken(true);
    return fetchLiveStreamsByLogins(logins);
  }

  if (!response.ok) return [];

  const payload: HelixListResponse<TwitchHelixStreamRaw> = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}
