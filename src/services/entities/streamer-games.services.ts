import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import { dedupeRequest } from "@services/utils/request-dedupe";

export type StreamerGameStatus = "to_play" | "playing" | "finished" | "dropped";

export interface StreamerGameListParams {
  streamerId: string;
  q?: string;
  status?: StreamerGameStatus;
  finishedYear?: string;
}

export interface StreamerGameRecord {
  id: string;
  streamerId: string;
  status: StreamerGameStatus;
  gameId?: string | null;
  customTitle?: string | null;
  customImage?: string | null;
  startedAt?: string | Date | null;
  finishedAt?: string | Date | null;
  rating?: number | null;
  notes?: string | null;
  sortOrder?: number | null;
  game?: {
    id?: string;
    title?: string;
    image?: string | null;
    synopsis?: string | null;
    igdbId?: number;
  } | null;
}

export interface CreateStreamerGamePayload {
  streamerId: string;
  gameId?: string | null;
  customTitle?: string | null;
  customImage?: string | null;
  status: StreamerGameStatus;
  startedAt?: string | Date | null;
  finishedAt?: string | Date | null;
  notes?: string | null;
  sortOrder?: number | null;
  rating?: number | null;
}

export const streamerGames = {
  findAll: {
    byParams: async (
      params: StreamerGameListParams
    ): Promise<StreamerGameRecord[]> => {
      const dedupeKey = `streamer-games:${params.streamerId}:${params.q ?? ""}:${params.status ?? ""}:${params.finishedYear ?? ""}`;
      return dedupeRequest(dedupeKey, async () => {
        const response = await httpClient.get<StreamerGameRecord[]>(
          ENDPOINTS.Internal.StreamerGames,
          { params }
        );
        return Array.isArray(response.data) ? response.data : [];
      });
    },
  },

  create: async (
    payload: CreateStreamerGamePayload
  ): Promise<StreamerGameRecord> => {
    const response = await httpClient.post<StreamerGameRecord>(
      ENDPOINTS.Internal.StreamerGames,
      payload
    );
    return response.data;
  },

  update: async (
    streamerGameId: string,
    payload: Partial<CreateStreamerGamePayload>
  ): Promise<StreamerGameRecord> => {
    const response = await httpClient.patch<StreamerGameRecord>(
      ENDPOINTS.Internal.StreamerGameById(streamerGameId),
      payload
    );
    return response.data;
  },

  remove: async (streamerGameId: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.StreamerGameById(streamerGameId));
  },
};
