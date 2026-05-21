import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type { TwitchChannelDto } from "@server/twitch/twitch.types";

interface TwitchChannelSearchResponse {
  results: TwitchChannelDto[];
}

export const twitch = {
  channels: {
    search: async (
      query: string,
      limit = 8,
      signal?: AbortSignal
    ): Promise<TwitchChannelDto[]> => {
      const response = await httpClient.get<TwitchChannelSearchResponse>(
        ENDPOINTS.Bff.Twitch.ChannelsSearch,
        {
          params: { q: query, limit },
          signal,
        }
      );
      return Array.isArray(response.data.results) ? response.data.results : [];
    },
  },
};
