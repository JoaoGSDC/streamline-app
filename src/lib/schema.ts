import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Tabela de Streamers
export const streamers = sqliteTable("streamers", {
  id: text("id").primaryKey(),
  twitchId: text("twitch_id").notNull().unique(),
  name: text("name").notNull(),
  twitchUsername: text("twitch_username").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  twitchUrl: text("twitch_url"),
  followers: text("followers"),
  socialLinks: text("social_links"), // JSON array of { label, url }
  /** Visual builder config for /[slug]/links */
  linkPageConfig: text("link_page_config"),
  /** Parceiro Streaminhub — inclui benefícios premium e extras */
  partner: integer("partner", { mode: "boolean" }).notNull().default(false),
  /** Assinatura premium paga */
  premium: integer("premium", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Tabela de Jogos
export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  igdbId: integer("igdb_id"),
  title: text("title").notNull(),
  image: text("image"),
  synopsis: text("synopsis"),
  genre: text("genre"), // JSON array
  platform: text("platform"),
  website: text("website"),
  storeLinks: text("store_links"), // JSON array
  isCustomGame: integer("is_custom_game", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Tabela de Jogos por Streamer (controle de status)
export const streamerGames = sqliteTable("streamer_games", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  gameId: text("game_id").references(() => games.id, { onDelete: "cascade" }),
  // Para jogos customizados sem cadastro prévio em games
  customTitle: text("custom_title"),
  customImage: text("custom_image"),
  status: text("status").notNull(), // to_play | playing | finished
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  /** Nota de 0 a 10 (Concluídos / Droppados) */
  rating: real("rating"),
  notes: text("notes"),
  sortOrder: integer("sort_order"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Tabela de Streams Agendadas
export const scheduledStreams = sqliteTable("scheduled_streams", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  gameId: text("game_id").references(() => games.id, { onDelete: "cascade" }),
  igdbGameId: integer("igdb_game_id"),
  gameTitle: text("game_title"),
  gameImage: text("game_image"),
  gameSynopsis: text("game_synopsis"),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }).notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  duration: text("duration").notNull(),
  links: text("links"), // JSON array of {url, name}
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Moderadores autorizados a gerenciar o canal de um streamer */
export const streamerModerators = sqliteTable("streamer_moderators", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  moderatorId: text("moderator_id").notNull(),
  moderatorUsername: text("moderator_username").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Streamers com o bot StreaminHub ativo no chat Twitch */
export const botActiveChannels = sqliteTable("bot_active_channels", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  twitchUsername: text("twitch_username").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deactivatedAt: integer("deactivated_at", { mode: "timestamp" }),
});

/** Versão monotônica da config do bot por canal (sync com serviço Bot) */
export const botChannelConfig = sqliteTable("bot_channel_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  configVersion: integer("config_version").notNull().default(1),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Comandos personalizados do chat Twitch */
export const botCommands = sqliteTable("bot_commands", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  trigger: text("trigger").notNull(),
  response: text("response").notNull(),
  cooldownSeconds: integer("cooldown_seconds").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  /** Chave fixa para comandos padrão (discord, redes, …) — não removíveis */
  builtinKey: text("builtin_key"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Timers automáticos de mensagens no chat */
export const botTimers = sqliteTable("bot_timers", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  name: text("name"),
  intervalMinutes: integer("interval_minutes").notNull(),
  /**
   * Minutos após o início da live para a primeira mensagem.
   * Null no banco = usar `intervalMinutes` (ex.: live 21:00, intervalo 5 → 21:05, 21:10…).
   */
  firstRunAfterMinutes: integer("first_run_after_minutes"),
  /** `live_elapsed` — disparos ancorados ao início da transmissão ao vivo. */
  scheduleMode: text("schedule_mode").notNull().default("live_elapsed"),
  message: text("message").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Último heartbeat IRC reportado pelo serviço bot por canal */
export const botChannelHeartbeat = sqliteTable("bot_channel_heartbeat", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  twitchUsername: text("twitch_username").notNull(),
  ircStatus: text("irc_status").notNull(),
  configVersion: integer("config_version").notNull(),
  botVersion: text("bot_version").notNull(),
  uptimeSeconds: integer("uptime_seconds").notNull(),
  recentErrors: text("recent_errors").notNull(),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
});

/** Configuração geral de economia por canal (owner) */
export const economyChannelConfig = sqliteTable("economy_channel_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  pointsEnabled: integer("points_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  levelsEnabled: integer("levels_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  publicRankingEnabled: integer("public_ranking_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  configVersion: integer("config_version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Configuração do sistema de pontos por canal */
export const economyPointsConfig = sqliteTable("economy_points_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  pointsPerInterval: integer("points_per_interval").notNull().default(10),
  intervalMinutes: integer("interval_minutes").notNull().default(5),
  minMessagesPerInterval: integer("min_messages_per_interval")
    .notNull()
    .default(1),
  subscriberMultiplier: real("subscriber_multiplier").notNull().default(2),
  vipMultiplier: real("vip_multiplier").notNull().default(1.5),
  moderatorMultiplier: real("moderator_multiplier").notNull().default(1),
  dailyPointsCap: integer("daily_points_cap"),
  earnMessageEnabled: integer("earn_message_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  earnMessageTemplate: text("earn_message_template"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Configuração do sistema de níveis por canal */
export const economyLevelsConfig = sqliteTable("economy_levels_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  /** linear | exponential | custom */
  xpFormula: text("xp_formula").notNull().default("linear"),
  xpPerMessage: integer("xp_per_message").notNull().default(5),
  xpPerMinuteWatching: integer("xp_per_minute_watching").notNull().default(1),
  /** JSON: [{ level, xpRequired, title? }] */
  levelsDefinition: text("levels_definition").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Perfil econômico de viewer por canal (points, xp, nível) */
export const channelViewerEconomy = sqliteTable("channel_viewer_economy", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  twitchUserId: text("twitch_user_id").notNull(),
  twitchUsername: text("twitch_username").notNull(),
  displayName: text("display_name").notNull(),
  points: integer("points").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  /** Pontos ganhos hoje (para limite diário) */
  dailyPointsEarned: integer("daily_points_earned").notNull().default(0),
  /** YYYY-MM-DD UTC */
  dailyPointsDate: text("daily_points_date"),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Coins premium por usuário da plataforma (nunca por canal) */
export const platformUserCoins = sqliteTable("platform_user_coins", {
  twitchUserId: text("twitch_user_id").primaryKey(),
  twitchUsername: text("twitch_username").notNull(),
  displayName: text("display_name").notNull(),
  coins: integer("coins").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Recompensas !daily / !early resgatadas por transmissão (uma vez por usuário por live) */
export const economyLiveRewardClaims = sqliteTable("economy_live_reward_claims", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  twitchUserId: text("twitch_user_id").notNull(),
  rewardKey: text("reward_key").notNull(),
  /** started_at ISO da transmissão Twitch — identifica a sessão da live */
  streamStartedAt: text("stream_started_at").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  claimedAt: integer("claimed_at", { mode: "timestamp" }).notNull(),
});

/** Auditoria de alterações manuais na economia */
export const economyAuditLog = sqliteTable("economy_audit_log", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").notNull(),
  actorUsername: text("actor_username").notNull(),
  targetTwitchUserId: text("target_twitch_user_id").notNull(),
  targetTwitchUsername: text("target_twitch_username").notNull(),
  action: text("action").notNull(),
  currencyType: text("currency_type").notNull(),
  previousValue: integer("previous_value").notNull(),
  newValue: integer("new_value").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Configuração da loja virtual por canal */
export const storeChannelConfig = sqliteTable("store_channel_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  publicEnabled: integer("public_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  defaultFulfillmentMode: text("default_fulfillment_mode")
    .notNull()
    .default("approval"),
  /** @username no Pixie.gg para compra de Coins (opcional; padrão: twitch_username) */
  pixieUsername: text("pixie_username"),
  configVersion: integer("config_version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Categorias de produtos da loja */
export const storeCategories = sqliteTable("store_categories", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Produtos da loja virtual */
export const storeProducts = sqliteTable("store_products", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => storeCategories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  imageUrl: text("image_url"),
  imageGallery: text("image_gallery").notNull().default("[]"),
  shortDescription: text("short_description"),
  fullDescription: text("full_description"),
  productType: text("product_type").notNull().default("custom"),
  rarity: text("rarity"),
  status: text("status").notNull().default("inactive"),
  stockQuantity: integer("stock_quantity"),
  stockUnlimited: integer("stock_unlimited", { mode: "boolean" })
    .notNull()
    .default(true),
  perUserLimit: integer("per_user_limit"),
  perUserLimitPeriod: text("per_user_limit_period"),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(0),
  pricePoints: integer("price_points").notNull().default(0),
  priceCoins: integer("price_coins").notNull().default(0),
  priceMode: text("price_mode").notNull().default("points_only"),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  sortOrder: integer("sort_order").notNull().default(0),
  tags: text("tags").notNull().default("[]"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  secret: integer("secret", { mode: "boolean" }).notNull().default(false),
  subscribersOnly: integer("subscribers_only", { mode: "boolean" })
    .notNull()
    .default(false),
  vipOnly: integer("vip_only", { mode: "boolean" }).notNull().default(false),
  followersOnly: integer("followers_only", { mode: "boolean" })
    .notNull()
    .default(false),
  minFollowDays: integer("min_follow_days").notNull().default(0),
  internalNotes: text("internal_notes"),
  fulfillmentMode: text("fulfillment_mode").notNull().default("approval"),
  lowStockThreshold: integer("low_stock_threshold"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Resgates / pedidos da loja */
export const storeRedemptions = sqliteTable("store_redemptions", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => storeProducts.id, { onDelete: "restrict" }),
  twitchUserId: text("twitch_user_id").notNull(),
  twitchUsername: text("twitch_username").notNull(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("pending"),
  paidPoints: integer("paid_points").notNull().default(0),
  paidCoins: integer("paid_coins").notNull().default(0),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  handledByUserId: text("handled_by_user_id"),
  handledByUsername: text("handled_by_username"),
  refundPoints: integer("refund_points").notNull().default(0),
  refundCoins: integer("refund_coins").notNull().default(0),
  idempotencyKey: text("idempotency_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
});

/** Auditoria da loja */
export const storeAuditLog = sqliteTable("store_audit_log", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").notNull(),
  actorUsername: text("actor_username").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  payload: text("payload"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Definições de badges da loja (estrutura futura) */
export const storeBadgeDefinitions = sqliteTable("store_badge_definitions", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Badges concedidos a usuários (estrutura futura) */
export const storeUserBadges = sqliteTable("store_user_badges", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  badgeId: text("badge_id")
    .notNull()
    .references(() => storeBadgeDefinitions.id, { onDelete: "cascade" }),
  twitchUserId: text("twitch_user_id").notNull(),
  grantedAt: integer("granted_at", { mode: "timestamp" }).notNull(),
});

/** Blacklist de termos para moderação simples */
export const botBlacklistTerms = sqliteTable("bot_blacklist_terms", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  matchType: text("match_type").notNull().default("contains"),
  action: text("action").notNull().default("delete"),
  timeoutSeconds: integer("timeout_seconds"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
