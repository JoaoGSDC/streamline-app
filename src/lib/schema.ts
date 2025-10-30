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
