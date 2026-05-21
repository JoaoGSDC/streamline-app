export interface TwitchChannelDto {
  id: string;
  login: string;
  displayName: string;
  thumbnailUrl: string;
  isLive: boolean;
  gameName: string;
}

export interface TwitchUserDto {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
  description?: string;
}

export interface TwitchLiveStatusDto {
  login: string;
  isLive: boolean;
  gameName: string;
  title: string;
}

export interface TwitchHelixChannelRaw {
  id?: string;
  broadcaster_login?: string;
  display_name?: string;
  broadcaster_name?: string;
  thumbnail_url?: string;
  is_live?: boolean;
  game_name?: string;
}

export interface TwitchHelixUserRaw {
  id?: string;
  login?: string;
  display_name?: string;
  profile_image_url?: string;
  description?: string;
}

export interface TwitchHelixStreamRaw {
  user_login?: string;
  game_name?: string;
  title?: string;
}
