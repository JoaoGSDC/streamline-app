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
    AdminPanelConfig: "/api/internal/admin/panel-config",
    Bot: {
      Activation: "/api/internal/bot/activation",
      OAuthAuthorize: "/api/internal/bot/oauth/authorize",
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
      RemoveUser: "/api/internal/economy/users/remove",
      ResetAllPoints: "/api/internal/economy/users/reset-all-points",
      PointsBlocklist: "/api/internal/economy/points-blocklist",
      PointsBlocklistEntry: (id: string) =>
        `/api/internal/economy/points-blocklist/${id}`,
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
    Counters: {
      Dashboard: "/api/internal/counters/dashboard",
      Config: "/api/internal/counters/config",
      Categories: "/api/internal/counters/categories",
      Counters: "/api/internal/counters/counters",
      History: "/api/internal/counters/history",
      CounterById: (id: string) => `/api/internal/counters/counters/${id}`,
      CounterAdjust: (id: string) => `/api/internal/counters/counters/${id}/adjust`,
      CounterArchive: (id: string) => `/api/internal/counters/counters/${id}/archive`,
      CounterDuplicate: (id: string) =>
        `/api/internal/counters/counters/${id}/duplicate`,
      InternalConfig: (streamerId: string) =>
        `/api/internal/counters/internal/channels/${streamerId}/config`,
      InternalAdjust: (streamerId: string) =>
        `/api/internal/counters/internal/channels/${streamerId}/adjust`,
    },
    Quotes: {
      Dashboard: "/api/internal/quotes/dashboard",
      Config: "/api/internal/quotes/config",
      Categories: "/api/internal/quotes/categories",
      Quotes: "/api/internal/quotes/quotes",
      QuoteById: (id: string) => `/api/internal/quotes/quotes/${id}`,
      QuoteArchive: (id: string) => `/api/internal/quotes/quotes/${id}/archive`,
      QuoteDuplicate: (id: string) => `/api/internal/quotes/quotes/${id}/duplicate`,
      InternalConfig: (streamerId: string) =>
        `/api/internal/quotes/internal/channels/${streamerId}/config`,
      InternalCreate: (streamerId: string) =>
        `/api/internal/quotes/internal/channels/${streamerId}/quotes`,
      InternalRandom: (streamerId: string) =>
        `/api/internal/quotes/internal/channels/${streamerId}/quotes/random`,
      InternalByNumber: (streamerId: string, number: number) =>
        `/api/internal/quotes/internal/channels/${streamerId}/quotes/by-number/${number}`,
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
    Raffles: {
      Active: "/api/internal/raffles/active",
      History: "/api/internal/raffles/history",
      Raffles: "/api/internal/raffles",
      RaffleById: (id: string) => `/api/internal/raffles/${id}`,
      RaffleStart: (id: string) => `/api/internal/raffles/${id}/start`,
      RafflePause: (id: string) => `/api/internal/raffles/${id}/pause`,
      RaffleResume: (id: string) => `/api/internal/raffles/${id}/resume`,
      RaffleClose: (id: string) => `/api/internal/raffles/${id}/close`,
      RaffleReopen: (id: string) => `/api/internal/raffles/${id}/reopen`,
      RaffleDraw: (id: string) => `/api/internal/raffles/${id}/draw`,
      RaffleReroll: (id: string) => `/api/internal/raffles/${id}/reroll`,
      RaffleStream: (id: string) => `/api/internal/raffles/${id}/stream`,
      RaffleExport: (id: string) => `/api/internal/raffles/${id}/export`,
      RaffleEntries: (id: string) => `/api/internal/raffles/${id}/entries`,
      RaffleEntryById: (id: string, entryId: string) =>
        `/api/internal/raffles/${id}/entries/${entryId}`,
      RaffleConfirmWinner: (id: string, winnerId: string) =>
        `/api/internal/raffles/${id}/winners/${winnerId}/confirm`,
      BotEntry: "/api/internal/raffles/bot/entry",
      BotMessage: "/api/internal/raffles/bot/message",
    },
  },
  Panel: {
    Config: "/api/panel/config",
    ConfigCheck: "/api/panel/config/check",
  },
  Auth: {
    TwitchCallback: "/api/auth/twitch/callback",
  },
} as const;
