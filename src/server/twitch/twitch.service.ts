import { twitchGateway } from "./twitch.gateway";
import type { TwitchEmoteDto } from "./twitch-emotes.types";
import type {
  TwitchChannelDto,
  TwitchLiveStatusDto,
  TwitchUserDto,
} from "./twitch.types";

export const twitchServerService = {
  searchChannels: async (
    query: string,
    limit: number
  ): Promise<TwitchChannelDto[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return twitchGateway.searchChannels(trimmed, limit);
  },

  getUserByLogin: async (login: string): Promise<TwitchUserDto | null> => {
    return twitchGateway.getUserByLogin(login);
  },

  getLiveStatusByLogins: async (
    logins: string[]
  ): Promise<Map<string, TwitchLiveStatusDto>> => {
    return twitchGateway.getLiveStatusByLogins(logins);
  },

  getChannelEmotes: async (
    broadcasterId: string
  ): Promise<TwitchEmoteDto[]> => {
    return twitchGateway.getChannelEmotesByBroadcasterId(broadcasterId);
  },
};
