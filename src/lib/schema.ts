import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

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
  /** Plano de assinatura: free | pro | enterprise */
  plan: text("plan").notNull().default("free"),
  planExpiresAt: integer("plan_expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Overrides de visibilidade do painel admin (somente diferenças do registry). */
export const userPanelConfig = sqliteTable("user_panel_config", {
  userId: text("user_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  overrides: text("overrides").notNull().default("{}"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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
  userCooldown: integer("user_cooldown").notNull().default(0),
  minPermission: text("min_permission").notNull().default("everyone"),
  /** JSON array: subscriber | vip | moderator | streamer */
  bypassCooldownFor: text("bypass_cooldown_for").notNull().default("[]"),
  maxUsesPerStream: integer("max_uses_per_stream").notNull().default(0),
  maxUsesPerUserPerStream: integer("max_uses_per_user_per_stream")
    .notNull()
    .default(0),
  seasonalLimitType: text("seasonal_limit_type").notNull().default("none"),
  seasonalLimitAmount: integer("seasonal_limit_amount").notNull().default(0),
  seasonalLimitDays: integer("seasonal_limit_days").notNull().default(0),
  requiresConfirmation: integer("requires_confirmation", { mode: "boolean" })
    .notNull()
    .default(false),
  isActionResponse: integer("is_action_response", { mode: "boolean" })
    .notNull()
    .default(false),
  isCaseSensitive: integer("is_case_sensitive", { mode: "boolean" })
    .notNull()
    .default(false),
  /** JSON array de triggers alternativos */
  aliases: text("aliases").notNull().default("[]"),
  argValidationType: text("arg_validation_type").notNull().default("none"),
  argRegexPattern: text("arg_regex_pattern"),
  argValidationError: text("arg_validation_error"),
  responseType: text("response_type").notNull().default("text"),
  /** JSON array de respostas para response_type = random */
  responseAlternatives: text("response_alternatives").notNull().default("[]"),
  useCount: integer("use_count").notNull().default(0),
  /** JSON — efeito de pontos configurável por comando */
  pointsEffect: text("points_effect"),
  counterEffect: text("counter_effect"),
  /** Mensagem exibida 1× por período de cooldown quando bloqueado */
  cooldownMessage: text("cooldown_message"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Auditoria de comandos do bot (CRUD, regex inválida, limites) */
export const botAuditLog = sqliteTable("bot_audit_log", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").notNull(),
  actorUsername: text("actor_username").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  action: text("action").notNull(),
  diff: text("diff"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Rastreamento de uso de comandos (limites por stream / sazonal) */
export const botCommandUsage = sqliteTable("bot_command_usage", {
  id: text("id").primaryKey(),
  commandId: text("command_id")
    .notNull()
    .references(() => botCommands.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull(),
  twitchUserId: text("twitch_user_id").notNull(),
  twitchLogin: text("twitch_login"),
  streamId: text("stream_id"),
  usedAt: integer("used_at", { mode: "timestamp" }).notNull(),
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
  /** Mínimo de viewers na live para disparar; null = sem exigência. */
  minViewers: integer("min_viewers"),
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

/** Viewers bloqueados de receber pontos automaticamente no canal */
export const economyPointsBlocklist = sqliteTable("economy_points_blocklist", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  twitchUserId: text("twitch_user_id").notNull(),
  twitchLogin: text("twitch_login").notNull(),
  displayName: text("display_name").notNull(),
  reason: text("reason"),
  createdByUserId: text("created_by_user_id"),
  createdByUsername: text("created_by_username"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
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

/** Configuração do módulo de quotes por canal */
export const quotesChannelConfig = sqliteTable("quotes_channel_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  publicEnabled: integer("public_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  autoCaptureContext: integer("auto_capture_context", { mode: "boolean" })
    .notNull()
    .default(true),
  configVersion: integer("config_version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Categorias personalizadas de quotes */
export const quoteCategories = sqliteTable("quote_categories", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Tags normalizadas de quotes */
export const quoteTags = sqliteTable("quote_tags", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Quotes do canal */
export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  text: text("text").notNull(),
  textNormalized: text("text_normalized").notNull(),
  speakerType: text("speaker_type").notNull().default("custom"),
  speakerName: text("speaker_name").notNull(),
  speakerTwitchId: text("speaker_twitch_id"),
  registeredByUserId: text("registered_by_user_id"),
  registeredByUsername: text("registered_by_username").notNull(),
  registeredByRole: text("registered_by_role").notNull().default("owner"),
  source: text("source").notNull().default("panel"),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  platform: text("platform").notNull().default("twitch"),
  streamTitle: text("stream_title"),
  streamCategory: text("stream_category"),
  gameName: text("game_name"),
  streamTags: text("stream_tags").notNull().default("[]"),
  streamStartedAt: integer("stream_started_at", { mode: "timestamp" }),
  streamElapsedSeconds: integer("stream_elapsed_seconds"),
  categoryId: text("category_id"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  isIconic: integer("is_iconic", { mode: "boolean" }).notNull().default(false),
  isHistoric: integer("is_historic", { mode: "boolean" }).notNull().default(false),
  isChannelMeme: integer("is_channel_meme", { mode: "boolean" }).notNull().default(false),
  displayCount: integer("display_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  customFields: text("custom_fields").notNull().default("{}"),
  internalNotes: text("internal_notes"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  status: text("status").notNull().default("active"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Relação N:N quote ↔ tag */
export const quoteTagAssignments = sqliteTable(
  "quote_tag_assignments",
  {
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => quoteTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.quoteId, table.tagId] }),
  })
);

/** Config do módulo de contadores por canal */
export const countersChannelConfig = sqliteTable("counters_channel_config", {
  streamerId: text("streamer_id")
    .primaryKey()
    .references(() => streamers.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  configVersion: integer("config_version").notNull().default(1),
  liveModePins: text("live_mode_pins").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Categorias de contadores */
export const counterCategories = sqliteTable("counter_categories", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Contadores ao vivo */
export const counters = sqliteTable("counters", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => counterCategories.id, {
    onDelete: "set null",
  }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("incremental"),
  value: real("value").notNull().default(0),
  minValue: real("min_value"),
  maxValue: real("max_value"),
  goalValue: real("goal_value"),
  goalReachedAt: integer("goal_reached_at", { mode: "timestamp" }),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  emoji: text("emoji"),
  tags: text("tags").notNull().default("[]"),
  visibility: text("visibility").notNull().default("team"),
  status: text("status").notNull().default("active"),
  resetPolicy: text("reset_policy").notNull().default("manual"),
  source: text("source").notNull().default("manual"),
  readonly: integer("readonly", { mode: "boolean" }).notNull().default(false),
  overlayConfig: text("overlay_config").notNull().default("{}"),
  sortOrder: integer("sort_order").notNull().default(0),
  useCount: integer("use_count").notNull().default(0),
  lastChangedAt: integer("last_changed_at", { mode: "timestamp" }),
  lastChangedBy: text("last_changed_by"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Histórico de alterações de contadores */
export const counterHistory = sqliteTable("counter_history", {
  id: text("id").primaryKey(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  counterId: text("counter_id").notNull(),
  counterSlug: text("counter_slug").notNull(),
  counterName: text("counter_name").notNull(),
  previousValue: real("previous_value").notNull(),
  newValue: real("new_value").notNull(),
  delta: real("delta"),
  operation: text("operation").notNull(),
  source: text("source").notNull(),
  actorUserId: text("actor_user_id"),
  actorUsername: text("actor_username"),
  actorDisplayName: text("actor_display_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Sorteios ao vivo */
export const raffles = sqliteTable("raffles", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  streamerId: text("streamer_id")
    .notNull()
    .references(() => streamers.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  keyword: text("keyword"),
  title: text("title"),
  prizeDescription: text("prize_description"),
  winnerCount: integer("winner_count").notNull().default(1),
  maxEntriesPerUser: integer("max_entries_per_user").notNull().default(1),
  durationSeconds: integer("duration_seconds"),
  pointsCost: integer("points_cost").notNull().default(0),
  requireFollower: integer("require_follower", { mode: "boolean" }).notNull().default(false),
  minFollowDays: integer("min_follow_days").notNull().default(0),
  requireSub: integer("require_sub", { mode: "boolean" }).notNull().default(false),
  allowedSubTiers: text("allowed_sub_tiers").notNull().default('["1","2","3"]'),
  requireVip: integer("require_vip", { mode: "boolean" }).notNull().default(false),
  excludeMods: integer("exclude_mods", { mode: "boolean" }).notNull().default(false),
  excludeVips: integer("exclude_vips", { mode: "boolean" }).notNull().default(false),
  requireWinnerConfirmation: integer("require_winner_confirmation", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  confirmationTimeoutSeconds: integer("confirmation_timeout_seconds")
    .notNull()
    .default(60),
  confirmationKeyword: text("confirmation_keyword").notNull().default("sim"),
  announceStart: integer("announce_start", { mode: "boolean" }).notNull().default(true),
  announceReminders: text("announce_reminders").notNull().default("[120,60,30]"),
  announceWinner: integer("announce_winner", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("draft"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const raffleEntries = sqliteTable("raffle_entries", {
  id: text("id").primaryKey(),
  raffleId: text("raffle_id")
    .notNull()
    .references(() => raffles.id, { onDelete: "cascade" }),
  twitchUserId: text("twitch_user_id").notNull(),
  twitchLogin: text("twitch_login").notNull(),
  displayName: text("display_name").notNull(),
  entryCount: integer("entry_count").notNull().default(1),
  source: text("source").notNull().default("chat"),
  enteredAt: integer("entered_at", { mode: "timestamp" }).notNull(),
});

export const raffleWinners = sqliteTable("raffle_winners", {
  id: text("id").primaryKey(),
  raffleId: text("raffle_id")
    .notNull()
    .references(() => raffles.id, { onDelete: "cascade" }),
  entryId: text("entry_id")
    .notNull()
    .references(() => raffleEntries.id),
  position: integer("position").notNull().default(1),
  drawnAt: integer("drawn_at", { mode: "timestamp" }).notNull(),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
  rerolledAt: integer("rerolled_at", { mode: "timestamp" }),
  rerollReason: text("reroll_reason"),
  status: text("status").notNull().default("pending"),
});

export const raffleChatMessages = sqliteTable("raffle_chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  raffleId: text("raffle_id")
    .notNull()
    .references(() => raffles.id, { onDelete: "cascade" }),
  twitchUserId: text("twitch_user_id").notNull(),
  twitchLogin: text("twitch_login").notNull(),
  displayName: text("display_name").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").notNull().default("chat"),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
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
