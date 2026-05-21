import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  ModeratorDto,
  ModeratorsListResponse,
} from "@api/internal/streamers/moderators.controller";
import type { StreamerSyncResponse } from "@api/internal/streamers/streamers-sync.controller";
import type { FeaturedStreamersApiResponse } from "@api/internal/streamers/featured-streamers.controller";
import type { PublicStreamerFlagsResponse } from "@api/internal/streamers/public-streamer.controller";

export interface SyncStreamerPayload {
  id?: string;
  twitchId: string;
  twitchUsername: string;
  name?: string;
  avatar?: string;
  bio?: string;
  twitchUrl?: string;
  followers?: string;
}

export const streamers = {
  sync: async (payload: SyncStreamerPayload): Promise<StreamerSyncResponse> => {
    const response = await httpClient.post<StreamerSyncResponse>(
      ENDPOINTS.Internal.StreamersSync,
      payload
    );
    return response.data;
  },

  featured: {
    findAll: async (): Promise<FeaturedStreamersApiResponse> => {
      const response = await httpClient.get<FeaturedStreamersApiResponse>(
        ENDPOINTS.Internal.StreamersFeatured
      );
      return response.data;
    },
  },

  public: {
    getFlags: async (username: string): Promise<PublicStreamerFlagsResponse> => {
      const response = await httpClient.get<PublicStreamerFlagsResponse>(
        ENDPOINTS.Internal.StreamerPublic(username)
      );
      return response.data;
    },
  },

  moderators: {
    list: async (streamerId: string): Promise<ModeratorDto[]> => {
      const response = await httpClient.get<ModeratorsListResponse>(
        ENDPOINTS.Internal.StreamerModerators(streamerId)
      );
      return response.data.moderators;
    },

    add: async (
      streamerId: string,
      username: string
    ): Promise<ModeratorDto> => {
      const response = await httpClient.post<{ moderator: ModeratorDto }>(
        ENDPOINTS.Internal.StreamerModerators(streamerId),
        { username }
      );
      return response.data.moderator;
    },

    remove: async (streamerId: string, moderatorId: string): Promise<void> => {
      await httpClient.delete(
        `${ENDPOINTS.Internal.StreamerModerators(streamerId)}?moderatorId=${encodeURIComponent(moderatorId)}`
      );
    },
  },
};
