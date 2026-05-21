import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import { fetchMergedByStreamerIds } from "@services/utils/fetch-merged-by-streamer-ids";
import { dedupeRequest } from "@services/utils/request-dedupe";

export interface ScheduledStreamPayload {
  streamerId: string;
  gameId?: string | null;
  igdbGameId?: number | null;
  gameTitle?: string | null;
  gameImage?: string | null;
  gameSynopsis?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string | null;
}

export interface ScheduledStreamRecord extends ScheduledStreamPayload {
  id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  game?: {
    title: string;
    image?: string;
    synopsis?: string;
    genre?: string[];
    platform?: string;
    storeLinks?: Array<{ name: string; url: string }>;
  } | null;
}

export const scheduledStreams = {
  findAll: {
    byStreamerId: async (streamerId: string): Promise<ScheduledStreamRecord[]> => {
      return dedupeRequest(`scheduled-streams:${streamerId}`, async () => {
        const response = await httpClient.get<ScheduledStreamRecord[]>(
          ENDPOINTS.Internal.ScheduledStreams,
          { params: { streamerId } }
        );
        return Array.isArray(response.data) ? response.data : [];
      });
    },

    mergedByStreamerIds: async (
      streamerIds: string[]
    ): Promise<ScheduledStreamRecord[]> => {
      return fetchMergedByStreamerIds<ScheduledStreamRecord>(
        streamerIds,
        (streamerId) =>
          `${ENDPOINTS.Internal.ScheduledStreams}?streamerId=${encodeURIComponent(streamerId)}`,
        "scheduled-streams"
      );
    },
  },

  create: async (
    payload: ScheduledStreamPayload
  ): Promise<ScheduledStreamRecord> => {
    const response = await httpClient.post<ScheduledStreamRecord>(
      ENDPOINTS.Internal.ScheduledStreams,
      payload
    );
    return response.data;
  },

  update: async (
    streamId: string,
    payload: Partial<ScheduledStreamPayload>
  ): Promise<ScheduledStreamRecord> => {
    const response = await httpClient.patch<ScheduledStreamRecord>(
      ENDPOINTS.Internal.ScheduledStreamById(streamId),
      payload
    );
    return response.data;
  },

  remove: async (streamId: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.ScheduledStreamById(streamId));
  },
};
