import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql, LibSQLDatabase } from "drizzle-orm/libsql";
import {
  drizzle as drizzleBetter,
  BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";

type DBType = LibSQLDatabase | BetterSQLite3Database;
let dbInstance: DBType | null = null;

const STREAMERS_TABLE = `
  CREATE TABLE IF NOT EXISTS streamers (
    id TEXT PRIMARY KEY,
    twitch_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    twitch_username TEXT NOT NULL UNIQUE,
    avatar TEXT,
    bio TEXT,
    twitch_url TEXT,
    followers TEXT,
    social_links TEXT,
    partner INTEGER NOT NULL DEFAULT 0,
    premium INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
`;

const GAMES_TABLE = `
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    igdb_id INTEGER,
    title TEXT NOT NULL,
    image TEXT,
    synopsis TEXT,
    genre TEXT,
    platform TEXT,
    website TEXT,
    store_links TEXT,
    is_custom_game INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );
`;

const STREAMER_GAMES_TABLE = `
  CREATE TABLE IF NOT EXISTS streamer_games (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    game_id TEXT,
    custom_title TEXT,
    custom_image TEXT,
    status TEXT NOT NULL,
    started_at INTEGER,
    finished_at INTEGER,
    rating REAL,
    notes TEXT,
    sort_order INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );
`;

const STREAMER_MODERATORS_TABLE = `
  CREATE TABLE IF NOT EXISTS streamer_moderators (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    moderator_username TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    UNIQUE(streamer_id, moderator_id)
  );
`;

const BOT_CHANNEL_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_channel_config (
    streamer_id TEXT PRIMARY KEY,
    config_version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const BOT_COMMANDS_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_commands (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const BOT_TIMERS_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_timers (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    name TEXT,
    interval_minutes INTEGER NOT NULL,
    message TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const BOT_BLACKLIST_TERMS_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_blacklist_terms (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    term TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'contains',
    action TEXT NOT NULL DEFAULT 'delete',
    timeout_seconds INTEGER,
    enabled INTEGER NOT NULL DEFAULT 1,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const SCHEDULED_STREAMS_TABLE = `
  CREATE TABLE IF NOT EXISTS scheduled_streams (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    game_id TEXT,
    igdb_game_id INTEGER,
    game_title TEXT,
    game_image TEXT,
    game_synopsis TEXT,
    scheduled_date INTEGER NOT NULL,
    scheduled_time TEXT NOT NULL,
    duration TEXT NOT NULL,
    links TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );
`;

async function runStreamerMigrations(execute: (sql: string) => unknown) {
  try {
    await execute(STREAMER_MODERATORS_TABLE);
  } catch {
    /* tabela já existe ou ambiente remoto */
  }

  const migrations = [
    `ALTER TABLE streamers ADD COLUMN social_links TEXT`,
    `ALTER TABLE streamers ADD COLUMN partner INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE streamers ADD COLUMN premium INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE streamers ADD COLUMN link_page_config TEXT`,
    `ALTER TABLE streamer_games ADD COLUMN rating REAL`,
  ];

  for (const sql of migrations) {
    try {
      await execute(sql);
    } catch {
      /* coluna já existe */
    }
  }

  try {
    await execute(
      `UPDATE streamers SET partner = 1 WHERE LOWER(twitch_username) = 'fantonlord'`
    );
  } catch {
    /* ignore */
  }
}

export async function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  if (dbUrl.startsWith("libsql://")) {
    const serviceClient = createClient({
      url: dbUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    dbInstance = drizzleLibsql(serviceClient);

    console.log("Connected to Turso remote database ✅");

    await runStreamerMigrations((sql) => serviceClient.execute(sql));

    try {
      await serviceClient.execute(
        `CREATE TABLE IF NOT EXISTS streamer_moderators (
          id TEXT PRIMARY KEY,
          streamer_id TEXT NOT NULL,
          moderator_id TEXT NOT NULL,
          moderator_username TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
          UNIQUE(streamer_id, moderator_id)
        )`
      );
    } catch {
      /* ignore */
    }

    await serviceClient.executeMultiple(
      `${STREAMERS_TABLE}${GAMES_TABLE}${STREAMER_GAMES_TABLE}${STREAMER_MODERATORS_TABLE}${SCHEDULED_STREAMS_TABLE}${BOT_CHANNEL_CONFIG_TABLE}${BOT_COMMANDS_TABLE}${BOT_TIMERS_TABLE}${BOT_BLACKLIST_TERMS_TABLE}`
    );
  } else {
    const dbPath = dbUrl.startsWith("file:")
      ? dbUrl.replace("file:", "")
      : dbUrl;

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath);

    await runStreamerMigrations((sql) => {
      sqlite.exec(sql);
    });

    sqlite.exec(
      `${STREAMERS_TABLE}${GAMES_TABLE}${STREAMER_GAMES_TABLE}${STREAMER_MODERATORS_TABLE}${SCHEDULED_STREAMS_TABLE}${BOT_CHANNEL_CONFIG_TABLE}${BOT_COMMANDS_TABLE}${BOT_TIMERS_TABLE}${BOT_BLACKLIST_TERMS_TABLE}`
    );

    console.log("Local SQLite database initialized ✅");
    dbInstance = drizzleBetter(sqlite);
  }

  return dbInstance;
}

void initializeDatabase();
