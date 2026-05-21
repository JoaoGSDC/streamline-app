export type { TwitchChannelDto, TwitchUserDto, TwitchLiveStatusDto } from "@server/twitch/twitch.types";

export interface TwitchChannelSearchResponse {
  results: import("@server/twitch/twitch.types").TwitchChannelDto[];
}
