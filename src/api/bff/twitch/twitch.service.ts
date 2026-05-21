import { twitchServerService } from "@server/twitch/twitch.service";
import type { TwitchChannelDto } from "./twitch.types";

export const twitchBffService = {
  searchChannels: async (
    query: string,
    limit: number
  ): Promise<TwitchChannelDto[]> => {
    return twitchServerService.searchChannels(query, limit);
  },
};
