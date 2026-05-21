/**
 * @deprecated Use @server/twitch ou services.twitch (BFF).
 * Mantido para compatibilidade durante a migração arquitetural.
 */
export type {
  TwitchChannelDto as TwitchChannelResult,
  TwitchUserDto as TwitchUserResult,
  TwitchLiveStatusDto as TwitchLiveInfo,
} from "@server/twitch/twitch.types";

import { twitchServerService } from "@server/twitch/twitch.service";

export const searchTwitchChannels = twitchServerService.searchChannels;
export const getTwitchUserByLogin = twitchServerService.getUserByLogin;
export const getTwitchLiveByLogins = twitchServerService.getLiveStatusByLogins;

/** @deprecated Use ensureTwitchAppAccessToken de @server/shared/twitch-oauth.client */
export async function ensureTwitchAppToken(forceRefresh = false): Promise<string> {
  const { ensureTwitchAppAccessToken } = await import(
    "@server/shared/twitch-oauth.client"
  );
  return ensureTwitchAppAccessToken(forceRefresh);
}
