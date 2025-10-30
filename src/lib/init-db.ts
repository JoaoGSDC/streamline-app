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

export async function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  // 🌐 Se for Turso (libsql://), usa cliente remoto
  if (dbUrl.startsWith("libsql://")) {
    const serviceClient = createClient({
      url: dbUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    dbInstance = drizzleLibsql(serviceClient);

    console.log("Connected to Turso remote database ✅");
    await serviceClient.executeMultiple(`
      CREATE TABLE IF NOT EXISTS streamers (
        id TEXT PRIMARY KEY,
        twitch_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        twitch_username TEXT NOT NULL UNIQUE,
        avatar TEXT,
        bio TEXT,
        twitch_url TEXT,
        followers TEXT,
        created_at INTEGER NOT NULL
      );

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

      CREATE TABLE IF NOT EXISTS streamer_games (
        id TEXT PRIMARY KEY,
        streamer_id TEXT NOT NULL,
        game_id TEXT,
        custom_title TEXT,
        custom_image TEXT,
        status TEXT NOT NULL,
        started_at INTEGER,
        finished_at INTEGER,
        notes TEXT,
        sort_order INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );

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
    `);
  } else {
    // 💾 Se for arquivo local, usa better-sqlite3
    const dbPath = dbUrl.startsWith("file:")
      ? dbUrl.replace("file:", "")
      : dbUrl;

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS streamers (
        id TEXT PRIMARY KEY,
        twitch_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        twitch_username TEXT NOT NULL UNIQUE,
        avatar TEXT,
        bio TEXT,
        twitch_url TEXT,
        followers TEXT,
        created_at INTEGER NOT NULL
      );

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

      CREATE TABLE IF NOT EXISTS streamer_games (
        id TEXT PRIMARY KEY,
        streamer_id TEXT NOT NULL,
        game_id TEXT,
        custom_title TEXT,
        custom_image TEXT,
        status TEXT NOT NULL,
        started_at INTEGER,
        finished_at INTEGER,
        notes TEXT,
        sort_order INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );

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
    `);

    console.log("Local SQLite database initialized ✅");
    dbInstance = drizzleBetter(sqlite);
  }

  return dbInstance;
}

// Garante inicialização
void initializeDatabase();
