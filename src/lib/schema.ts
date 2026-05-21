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
  message: text("message").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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
