import {
  fetchChannelEmotes,
  fetchLiveStreamsByLogins,
  fetchSearchChannels,
  fetchUserByLogin,
} from "./twitch.client";
import type { TwitchEmoteDto } from "./twitch-emotes.types";
import {
  createOfflineLiveStatus,
  mapHelixChannelToDto,
  mapHelixStreamToLiveStatus,
  mapHelixUserToDto,
} from "./twitch.mapper";
import type {
  TwitchChannelDto,
  TwitchLiveStatusDto,
  TwitchUserDto,
} from "./twitch.types";
import { normalizeTwitchLogin } from "./twitch.validator";

export const twitchGateway = {
  searchChannels: async (
    query: string,
    limit: number
  ): Promise<TwitchChannelDto[]> => {
    const channels = await fetchSearchChannels(query, limit);
    return channels.map(mapHelixChannelToDto);
  },

  getUserByLogin: async (login: string): Promise<TwitchUserDto | null> => {
    const normalized = normalizeTwitchLogin(login);
    if (!normalized) return null;
    const user = await fetchUserByLogin(normalized);
    if (!user) return null;
    return mapHelixUserToDto(user);
  },

  getLiveStatusByLogins: async (
    logins: string[]
  ): Promise<Map<string, TwitchLiveStatusDto>> => {
    const unique = [
      ...new Set(logins.map(normalizeTwitchLogin).filter(Boolean)),
    ].slice(0, 100);

    const statusMap = new Map<string, TwitchLiveStatusDto>();
    if (unique.length === 0) return statusMap;

    for (const login of unique) {
      statusMap.set(login, createOfflineLiveStatus(login));
    }

    const liveStreams = await fetchLiveStreamsByLogins(unique);
    for (const stream of liveStreams) {
      const liveStatus = mapHelixStreamToLiveStatus(stream);
      if (!liveStatus.login) continue;
      statusMap.set(liveStatus.login, liveStatus);
    }

    return statusMap;
  },

  getChannelEmotesByBroadcasterId: async (
    broadcasterId: string
  ): Promise<TwitchEmoteDto[]> => {
    if (!broadcasterId.trim()) return [];
    const raw = await fetchChannelEmotes(broadcasterId);
    return raw.map((emote) => ({
      id: emote.id,
      name: emote.name,
      imageUrl1x: emote.images.url_1x,
      imageUrl2x: emote.images.url_2x,
      imageUrl4x: emote.images.url_4x,
      emoteType: emote.emote_type ?? "channel",
      code: emote.name,
    }));
  },
};
