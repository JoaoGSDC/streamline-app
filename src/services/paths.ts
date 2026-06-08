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
      CommandUsage: (id: string) => `/api/internal/bot/commands/${id}/usage`,
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
    Economy: {
      Overview: "/api/internal/economy/overview",
      Config: "/api/internal/economy/config",
      ConfigGeneral: "/api/internal/economy/config/general",
      ConfigPoints: "/api/internal/economy/config/points",
      ConfigLevels: "/api/internal/economy/config/levels",
      Users: "/api/internal/economy/users",
      Ranking: "/api/internal/economy/ranking",
      UserBalance: (twitchUserId: string) =>
        `/api/internal/economy/users/${encodeURIComponent(twitchUserId)}/balance`,
      AdjustPoints: "/api/internal/economy/users/adjust-points",
      SetPoints: "/api/internal/economy/users/set-points",
      AdjustCoins: "/api/internal/economy/users/adjust-coins",
      ResetUser: "/api/internal/economy/users/reset",
      ResetAllPoints: "/api/internal/economy/users/reset-all-points",
      InternalConfig: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/config`,
      InternalBalance: (streamerId: string, twitchUserId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/balance/${encodeURIComponent(twitchUserId)}`,
      InternalRanking: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/ranking`,
      InternalSyncViewer: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/viewers/sync`,
      InternalAwardPoints: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/points/award`,
      InternalAdjustPoints: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/points/adjust`,
      InternalAwardXp: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/xp/award`,
      InternalLiveRewardClaim: (streamerId: string) =>
        `/api/internal/economy/internal/channels/${streamerId}/live-rewards/claim`,
    },
    Store: {
      Dashboard: "/api/internal/store/dashboard",
      Config: "/api/internal/store/config",
      Categories: "/api/internal/store/categories",
      CategoryById: (id: string) => `/api/internal/store/categories/${id}`,
      CategoriesReorder: "/api/internal/store/categories/reorder",
      Products: "/api/internal/store/products",
      ProductById: (id: string) => `/api/internal/store/products/${id}`,
      ProductDuplicate: (id: string) =>
        `/api/internal/store/products/${id}/duplicate`,
      Redemptions: "/api/internal/store/redemptions",
      RedemptionById: (id: string) => `/api/internal/store/redemptions/${id}`,
      RedemptionRefund: (id: string) =>
        `/api/internal/store/redemptions/${id}/refund`,
      PublicCatalog: (username: string) =>
        `/api/internal/store/public/${encodeURIComponent(username)}`,
      PublicBalance: (username: string) =>
        `/api/internal/store/public/${encodeURIComponent(username)}/balance`,
      PublicRedeem: (username: string) =>
        `/api/internal/store/public/${encodeURIComponent(username)}/redeem`,
      InternalConfig: (streamerId: string) =>
        `/api/internal/store/internal/channels/${streamerId}/config`,
      InternalProducts: (streamerId: string) =>
        `/api/internal/store/internal/channels/${streamerId}/products`,
      InternalBalance: (streamerId: string, twitchUserId: string) =>
        `/api/internal/store/internal/channels/${streamerId}/balance/${encodeURIComponent(twitchUserId)}`,
      InternalRedeem: (streamerId: string) =>
        `/api/internal/store/internal/channels/${streamerId}/redeem`,
      InternalRedemptions: (streamerId: string) =>
        `/api/internal/store/internal/channels/${streamerId}/redemptions`,
      InternalCatalog: (username: string) =>
        `/api/internal/store/internal/catalog/${encodeURIComponent(username)}`,
    },
  },
  Auth: {
    TwitchCallback: "/api/auth/twitch/callback",
  },
} as const;
