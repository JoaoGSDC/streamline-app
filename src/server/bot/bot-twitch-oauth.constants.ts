/** Escopos OAuth do streamer para o bot (chat + broadcast). */
export const STREAMER_BOT_OAUTH_SCOPES = [
  "channel:bot",
  "channel:manage:broadcast",
] as const;

export const TWITCH_BOT_OAUTH_STATE_COOKIE = "twitch_bot_oauth_state";
export const TWITCH_BOT_OAUTH_STREAMER_COOKIE = "twitch_bot_oauth_streamer";

export const BROADCAST_OAUTH_SCOPE = "channel:manage:broadcast";
export const BOT_CHAT_OAUTH_SCOPE = "channel:bot";
