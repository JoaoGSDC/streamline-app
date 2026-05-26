export const ENDPOINTS = {
  Bff: {
    Auth: {
      TwitchAuthorize: "/api/bff/auth/twitch/authorize",
    },
    Twitch: {
      ChannelsSearch: "/api/bff/twitch/channels/search",
    },
    Igdb: {
      Search: "/api/bff/igdb/search",
      GameById: (gameId: number | string) => `/api/bff/igdb/games/${gameId}`,
    },
  },
  Internal: {
    Auth: {
      Session: "/api/internal/auth/session",
    },
    Games: "/api/internal/games",
    ScheduledStreams: "/api/internal/scheduled-streams",
    ScheduledStreamById: (streamId: string) =>
      `/api/internal/scheduled-streams/${streamId}`,
    StreamerGames: "/api/internal/streamer-games",
    StreamerGameById: (gameId: string) => `/api/internal/streamer-games/${gameId}`,
    StreamersSync: "/api/internal/streamers/sync",
    StreamersFeatured: "/api/internal/streamers/public/featured",
    StreamerPublic: (username: string) =>
      `/api/internal/streamers/public/${encodeURIComponent(username)}`,
    StreamerSocialLinks: (streamerId: string) =>
      `/api/internal/streamers/${streamerId}/social-links`,
    StreamerPublicSocialLinks: (username: string) =>
      `/api/internal/streamers/public/${encodeURIComponent(username)}/social-links`,
    StreamerModerators: (streamerId: string) =>
      `/api/internal/streamers/${streamerId}/moderators`,
    AdminChannels: "/api/internal/admin/channels",
    Bot: {
      Activation: "/api/internal/bot/activation",
      Commands: "/api/internal/bot/commands",
      CommandById: (id: string) => `/api/internal/bot/commands/${id}`,
      Timers: "/api/internal/bot/timers",
      TimerById: (id: string) => `/api/internal/bot/timers/${id}`,
      Blacklist: "/api/internal/bot/blacklist",
      BlacklistById: (id: string) => `/api/internal/bot/blacklist/${id}`,
      Variables: "/api/internal/bot/variables",
      Emotes: "/api/internal/bot/emotes",
      Status: "/api/internal/bot/status",
      InternalActiveChannels: "/api/internal/bot/internal/active-channels",
      InternalConfig: (streamerId: string) =>
        `/api/internal/bot/internal/channels/${streamerId}/config`,
      InternalCommands: (streamerId: string) =>
        `/api/internal/bot/internal/channels/${streamerId}/commands`,
    },
  },
  Auth: {
    TwitchCallback: "/api/auth/twitch/callback",
  },
} as const;
