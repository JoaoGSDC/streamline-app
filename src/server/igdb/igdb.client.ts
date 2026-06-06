import axios, { type AxiosInstance } from "axios";
import {
  ensureTwitchAppAccessToken,
  getTwitchClientId,
} from "@server/shared/twitch-oauth.client";
import type { IgdbGameRaw } from "./igdb.types";

const IGDB_BASE_URL = "https://api.igdb.com/v4";

function createIgdbAxiosClient(): AxiosInstance {
  return axios.create({
    baseURL: IGDB_BASE_URL,
    headers: {
      "Client-ID": getTwitchClientId(),
      Authorization: "",
      "Content-Type": "text/plain",
    },
  });
}

let igdbClient = createIgdbAxiosClient();

async function syncAuthHeaders(forceRefresh = false): Promise<void> {
  const accessToken = await ensureTwitchAppAccessToken(forceRefresh);
  igdbClient.defaults.headers["Client-ID"] = getTwitchClientId();
  igdbClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
}

async function postIgdbQuery<T>(endpoint: string, body: string): Promise<T[]> {
  await syncAuthHeaders();
  try {
    const response = await igdbClient.post<T[]>(endpoint, body);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status !== 401) throw error;
    await syncAuthHeaders(true);
    const retryResponse = await igdbClient.post<T[]>(endpoint, body);
    return Array.isArray(retryResponse.data) ? retryResponse.data : [];
  }
}

export async function queryIgdbGamesSearch(
  query: string,
  limit: number
): Promise<IgdbGameRaw[]> {
  const escapedQuery = query.replace(/"/g, '\\"');
  const body = `search "${escapedQuery}"; fields id,name,cover.url,screenshots.url,summary,genres.name,platforms.name,release_dates.date,websites.url; limit ${limit};`;
  return postIgdbQuery<IgdbGameRaw>("/games", body);
}

export async function queryIgdbGameById(gameId: number): Promise<IgdbGameRaw | null> {
  const body = `fields id,name,cover.url,screenshots.url,summary,genres.name,platforms.name,release_dates.date,websites.url,videos.video_id; where id = ${gameId};`;
  const games = await postIgdbQuery<IgdbGameRaw>("/games", body);
  return games[0] ?? null;
}
