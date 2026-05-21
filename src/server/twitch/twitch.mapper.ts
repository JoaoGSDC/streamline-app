import type {
  TwitchChannelDto,
  TwitchHelixChannelRaw,
  TwitchHelixStreamRaw,
  TwitchHelixUserRaw,
  TwitchLiveStatusDto,
  TwitchUserDto,
} from "./twitch.types";

export function mapHelixChannelToDto(channel: TwitchHelixChannelRaw): TwitchChannelDto {
  return {
    id: String(channel.id ?? ""),
    login: String(channel.broadcaster_login ?? "").toLowerCase(),
    displayName: String(
      channel.display_name ??
        channel.broadcaster_name ??
        channel.broadcaster_login ??
        ""
    ),
    thumbnailUrl: String(channel.thumbnail_url ?? "").replace(
      /-\{width\}x\{height\}/,
      "-70x70"
    ),
    isLive: Boolean(channel.is_live),
    gameName: String(channel.game_name ?? ""),
  };
}

export function mapHelixUserToDto(user: TwitchHelixUserRaw): TwitchUserDto {
  return {
    id: String(user.id ?? ""),
    login: String(user.login ?? "").toLowerCase(),
    displayName: String(user.display_name ?? user.login ?? ""),
    profileImageUrl: String(user.profile_image_url ?? ""),
    description: user.description ? String(user.description) : undefined,
  };
}

export function createOfflineLiveStatus(login: string): TwitchLiveStatusDto {
  return { login, isLive: false, gameName: "", title: "" };
}

export function mapHelixStreamToLiveStatus(stream: TwitchHelixStreamRaw): TwitchLiveStatusDto {
  const login = String(stream.user_login ?? "").toLowerCase();
  return {
    login,
    isLive: true,
    gameName: String(stream.game_name ?? ""),
    title: String(stream.title ?? ""),
  };
}
