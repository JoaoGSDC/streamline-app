import {
  ensureTwitchAppAccessToken,
  getTwitchClientId,
} from "@server/shared/twitch-oauth.client";

const TWITCH_HELIX_BASE = "https://api.twitch.tv/helix";

interface HelixPaginatedResponse<T> {
  data?: T[];
  total?: number;
}

async function helixGetWithTotal<T>(
  path: string,
  searchParams: URLSearchParams,
  retried = false
): Promise<{ total: number | null; data: T[] }> {
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
    return helixGetWithTotal(path, searchParams, true);
  }

  if (!response.ok) {
    return { total: null, data: [] };
  }

  const payload = (await response.json()) as HelixPaginatedResponse<T>;
  return {
    total: typeof payload.total === "number" ? payload.total : null,
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

/** Total de seguidores do canal (Helix GET /channels/followers). */
export async function fetchChannelFollowerTotal(
  broadcasterId: string
): Promise<number | null> {
  if (!broadcasterId.trim()) return null;

  const params = new URLSearchParams({
    broadcaster_id: broadcasterId,
    first: "1",
  });

  const { total } = await helixGetWithTotal("/channels/followers", params);
  return total;
}

/** Total de inscritos (Helix GET /subscriptions). Pode falhar sem token do broadcaster. */
export async function fetchChannelSubscriberTotal(
  broadcasterId: string
): Promise<number | null> {
  if (!broadcasterId.trim()) return null;

  const params = new URLSearchParams({
    broadcaster_id: broadcasterId,
    first: "1",
  });

  const { total } = await helixGetWithTotal("/subscriptions", params);
  return total;
}
