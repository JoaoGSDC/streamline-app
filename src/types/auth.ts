export interface TwitchSessionUser {
  id: string;
  name: string;
  twitchUsername: string;
  avatar: string;
  bio: string;
  twitchUrl: string;
  followers: string;
  accessToken: string;
  broadcasterType: string;
  partner: boolean;
  premium: boolean;
  createdAt: string;
}

export type TwitchAuthErrorCode =
  | "access_denied"
  | "no_code"
  | "no_user"
  | "callback_error"
  | "invalid_state"
  | "unknown";
