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

const BOT_ACTIVE_CHANNELS_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_active_channels (
    streamer_id TEXT PRIMARY KEY,
    twitch_username TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deactivated_at INTEGER,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
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
    builtin_key TEXT,
    user_cooldown INTEGER NOT NULL DEFAULT 0,
    min_permission TEXT NOT NULL DEFAULT 'everyone',
    bypass_cooldown_for TEXT NOT NULL DEFAULT '[]',
    max_uses_per_stream INTEGER NOT NULL DEFAULT 0,
    max_uses_per_user_per_stream INTEGER NOT NULL DEFAULT 0,
    seasonal_limit_type TEXT NOT NULL DEFAULT 'none',
    seasonal_limit_amount INTEGER NOT NULL DEFAULT 0,
    seasonal_limit_days INTEGER NOT NULL DEFAULT 0,
    requires_confirmation INTEGER NOT NULL DEFAULT 0,
    is_action_response INTEGER NOT NULL DEFAULT 0,
    is_case_sensitive INTEGER NOT NULL DEFAULT 0,
    aliases TEXT NOT NULL DEFAULT '[]',
    arg_validation_type TEXT NOT NULL DEFAULT 'none',
    arg_regex_pattern TEXT,
    arg_validation_error TEXT,
    response_type TEXT NOT NULL DEFAULT 'text',
    response_alternatives TEXT NOT NULL DEFAULT '[]',
    use_count INTEGER NOT NULL DEFAULT 0,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const BOT_COMMAND_USAGE_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_command_usage (
    id TEXT PRIMARY KEY,
    command_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    twitch_user_id TEXT NOT NULL,
    twitch_login TEXT,
    stream_id TEXT,
    used_at INTEGER NOT NULL,
    FOREIGN KEY (command_id) REFERENCES bot_commands(id) ON DELETE CASCADE
  );
`;

const BOT_AUDIT_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_audit_log (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    actor_username TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    diff TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const BOT_TIMERS_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_timers (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    name TEXT,
    interval_minutes INTEGER NOT NULL,
    first_run_after_minutes INTEGER,
    schedule_mode TEXT NOT NULL DEFAULT 'live_elapsed',
    message TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const BOT_CHANNEL_HEARTBEAT_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_channel_heartbeat (
    streamer_id TEXT PRIMARY KEY,
    twitch_username TEXT NOT NULL,
    irc_status TEXT NOT NULL,
    config_version INTEGER NOT NULL,
    bot_version TEXT NOT NULL,
    uptime_seconds INTEGER NOT NULL,
    recent_errors TEXT NOT NULL,
    received_at INTEGER NOT NULL,
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

const ECONOMY_CHANNEL_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS economy_channel_config (
    streamer_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    points_enabled INTEGER NOT NULL DEFAULT 0,
    levels_enabled INTEGER NOT NULL DEFAULT 0,
    public_ranking_enabled INTEGER NOT NULL DEFAULT 1,
    config_version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const ECONOMY_POINTS_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS economy_points_config (
    streamer_id TEXT PRIMARY KEY,
    points_per_interval INTEGER NOT NULL DEFAULT 10,
    interval_minutes INTEGER NOT NULL DEFAULT 5,
    min_messages_per_interval INTEGER NOT NULL DEFAULT 1,
    subscriber_multiplier REAL NOT NULL DEFAULT 2,
    vip_multiplier REAL NOT NULL DEFAULT 1.5,
    moderator_multiplier REAL NOT NULL DEFAULT 1,
    daily_points_cap INTEGER,
    earn_message_enabled INTEGER NOT NULL DEFAULT 0,
    earn_message_template TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const ECONOMY_LEVELS_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS economy_levels_config (
    streamer_id TEXT PRIMARY KEY,
    xp_formula TEXT NOT NULL DEFAULT 'linear',
    xp_per_message INTEGER NOT NULL DEFAULT 5,
    xp_per_minute_watching INTEGER NOT NULL DEFAULT 1,
    levels_definition TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const CHANNEL_VIEWER_ECONOMY_TABLE = `
  CREATE TABLE IF NOT EXISTS channel_viewer_economy (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    twitch_user_id TEXT NOT NULL,
    twitch_username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    daily_points_earned INTEGER NOT NULL DEFAULT 0,
    daily_points_date TEXT,
    last_activity_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    UNIQUE(streamer_id, twitch_user_id)
  );
  CREATE INDEX IF NOT EXISTS idx_channel_viewer_economy_streamer_points
    ON channel_viewer_economy(streamer_id, points DESC);
  CREATE INDEX IF NOT EXISTS idx_channel_viewer_economy_streamer_activity
    ON channel_viewer_economy(streamer_id, last_activity_at DESC);
`;

const PLATFORM_USER_COINS_TABLE = `
  CREATE TABLE IF NOT EXISTS platform_user_coins (
    twitch_user_id TEXT PRIMARY KEY,
    twitch_username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_platform_user_coins_username
    ON platform_user_coins(twitch_username);
`;

const ECONOMY_LIVE_REWARD_CLAIMS_TABLE = `
  CREATE TABLE IF NOT EXISTS economy_live_reward_claims (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    twitch_user_id TEXT NOT NULL,
    reward_key TEXT NOT NULL,
    stream_started_at TEXT NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    claimed_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_economy_live_reward_claims_unique
    ON economy_live_reward_claims(streamer_id, twitch_user_id, reward_key, stream_started_at);
`;

const ECONOMY_AUDIT_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS economy_audit_log (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    actor_username TEXT NOT NULL,
    target_twitch_user_id TEXT NOT NULL,
    target_twitch_username TEXT NOT NULL,
    action TEXT NOT NULL,
    currency_type TEXT NOT NULL,
    previous_value INTEGER NOT NULL,
    new_value INTEGER NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_economy_audit_log_streamer_created
    ON economy_audit_log(streamer_id, created_at DESC);
`;

const STORE_CHANNEL_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS store_channel_config (
    streamer_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    public_enabled INTEGER NOT NULL DEFAULT 1,
    default_fulfillment_mode TEXT NOT NULL DEFAULT 'approval',
    pixie_username TEXT,
    config_version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
`;

const STORE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS store_categories (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    UNIQUE(streamer_id, slug)
  );
  CREATE INDEX IF NOT EXISTS idx_store_categories_streamer_sort
    ON store_categories(streamer_id, sort_order);
`;

const STORE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS store_products (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image_url TEXT,
    image_gallery TEXT NOT NULL DEFAULT '[]',
    short_description TEXT,
    full_description TEXT,
    product_type TEXT NOT NULL DEFAULT 'custom',
    rarity TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    stock_quantity INTEGER,
    stock_unlimited INTEGER NOT NULL DEFAULT 1,
    per_user_limit INTEGER,
    per_user_limit_period TEXT,
    cooldown_minutes INTEGER NOT NULL DEFAULT 0,
    price_points INTEGER NOT NULL DEFAULT 0,
    price_coins INTEGER NOT NULL DEFAULT 0,
    price_mode TEXT NOT NULL DEFAULT 'points_only',
    starts_at INTEGER,
    ends_at INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    secret INTEGER NOT NULL DEFAULT 0,
    subscribers_only INTEGER NOT NULL DEFAULT 0,
    vip_only INTEGER NOT NULL DEFAULT 0,
    followers_only INTEGER NOT NULL DEFAULT 0,
    min_follow_days INTEGER NOT NULL DEFAULT 0,
    internal_notes TEXT,
    fulfillment_mode TEXT NOT NULL DEFAULT 'approval',
    low_stock_threshold INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES store_categories(id),
    UNIQUE(streamer_id, slug)
  );
  CREATE INDEX IF NOT EXISTS idx_store_products_streamer_status
    ON store_products(streamer_id, status, sort_order);
`;

const STORE_REDEMPTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS store_redemptions (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    twitch_user_id TEXT NOT NULL,
    twitch_username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_points INTEGER NOT NULL DEFAULT 0,
    paid_coins INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    internal_notes TEXT,
    handled_by_user_id TEXT,
    handled_by_username TEXT,
    refund_points INTEGER NOT NULL DEFAULT 0,
    refund_coins INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    delivered_at INTEGER,
    cancelled_at INTEGER,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id),
    UNIQUE(streamer_id, idempotency_key)
  );
  CREATE INDEX IF NOT EXISTS idx_store_redemptions_streamer_status
    ON store_redemptions(streamer_id, status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_store_redemptions_user
    ON store_redemptions(streamer_id, twitch_user_id, created_at DESC);
`;

const STORE_AUDIT_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS store_audit_log (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    actor_username TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_store_audit_log_streamer_created
    ON store_audit_log(streamer_id, created_at DESC);
`;

const STORE_BADGE_DEFINITIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS store_badge_definitions (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    UNIQUE(streamer_id, key)
  );
`;

const STORE_USER_BADGES_TABLE = `
  CREATE TABLE IF NOT EXISTS store_user_badges (
    id TEXT PRIMARY KEY,
    streamer_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    twitch_user_id TEXT NOT NULL,
    granted_at INTEGER NOT NULL,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES store_badge_definitions(id) ON DELETE CASCADE,
    UNIQUE(streamer_id, badge_id, twitch_user_id)
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

  try {
    await execute(BOT_ACTIVE_CHANNELS_TABLE);
  } catch {
    /* tabela já existe ou ambiente remoto */
  }

  try {
    await execute(BOT_CHANNEL_HEARTBEAT_TABLE);
  } catch {
    /* tabela já existe ou ambiente remoto */
  }

  const economyTables = [
    ECONOMY_CHANNEL_CONFIG_TABLE,
    ECONOMY_POINTS_CONFIG_TABLE,
    ECONOMY_LEVELS_CONFIG_TABLE,
    CHANNEL_VIEWER_ECONOMY_TABLE,
    PLATFORM_USER_COINS_TABLE,
    ECONOMY_LIVE_REWARD_CLAIMS_TABLE,
    ECONOMY_AUDIT_LOG_TABLE,
  ];

  for (const sql of economyTables) {
    try {
      await execute(sql);
    } catch {
      /* tabela já existe ou ambiente remoto */
    }
  }

  const storeTables = [
    STORE_CHANNEL_CONFIG_TABLE,
    STORE_CATEGORIES_TABLE,
    STORE_PRODUCTS_TABLE,
    STORE_REDEMPTIONS_TABLE,
    STORE_AUDIT_LOG_TABLE,
    STORE_BADGE_DEFINITIONS_TABLE,
    STORE_USER_BADGES_TABLE,
  ];

  for (const sql of storeTables) {
    try {
      await execute(sql);
    } catch {
      /* tabela já existe ou ambiente remoto */
    }
  }

  const migrations = [
    `ALTER TABLE streamers ADD COLUMN social_links TEXT`,
    `ALTER TABLE streamers ADD COLUMN partner INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE streamers ADD COLUMN premium INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE streamers ADD COLUMN link_page_config TEXT`,
    `ALTER TABLE streamer_games ADD COLUMN rating REAL`,
    `ALTER TABLE bot_commands ADD COLUMN builtin_key TEXT`,
    `ALTER TABLE bot_commands ADD COLUMN user_cooldown INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN min_permission TEXT NOT NULL DEFAULT 'everyone'`,
    `ALTER TABLE bot_commands ADD COLUMN bypass_cooldown_for TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE bot_commands ADD COLUMN max_uses_per_stream INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN max_uses_per_user_per_stream INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN seasonal_limit_type TEXT NOT NULL DEFAULT 'none'`,
    `ALTER TABLE bot_commands ADD COLUMN seasonal_limit_amount INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN seasonal_limit_days INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN requires_confirmation INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN is_action_response INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN is_case_sensitive INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_commands ADD COLUMN aliases TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE bot_commands ADD COLUMN arg_validation_type TEXT NOT NULL DEFAULT 'none'`,
    `ALTER TABLE bot_commands ADD COLUMN arg_regex_pattern TEXT`,
    `ALTER TABLE bot_commands ADD COLUMN arg_validation_error TEXT`,
    `ALTER TABLE bot_commands ADD COLUMN response_type TEXT NOT NULL DEFAULT 'text'`,
    `ALTER TABLE bot_commands ADD COLUMN response_alternatives TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE bot_commands ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE bot_timers ADD COLUMN first_run_after_minutes INTEGER`,
    `ALTER TABLE bot_timers ADD COLUMN schedule_mode TEXT NOT NULL DEFAULT 'live_elapsed'`,
    `ALTER TABLE bot_timers ADD COLUMN min_viewers INTEGER`,
    `ALTER TABLE store_channel_config ADD COLUMN pixie_username TEXT`,
    `ALTER TABLE streamers ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'`,
    `ALTER TABLE streamers ADD COLUMN plan_expires_at INTEGER`,
  ];

  for (const sql of migrations) {
    try {
      await execute(sql);
    } catch {
      /* coluna já existe */
    }
  }

  try {
    await execute(BOT_COMMAND_USAGE_TABLE);
  } catch {
    /* tabela já existe */
  }

  try {
    await execute(BOT_AUDIT_LOG_TABLE);
  } catch {
    /* tabela já existe */
  }

  const auditIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_bot_audit_log_streamer_created
      ON bot_audit_log(streamer_id, created_at DESC)`,
  ];

  for (const sql of auditIndexes) {
    try {
      await execute(sql);
    } catch {
      /* índice já existe */
    }
  }

  const usageIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_usage_command_stream ON bot_command_usage(command_id, stream_id)`,
    `CREATE INDEX IF NOT EXISTS idx_usage_command_user_stream ON bot_command_usage(command_id, twitch_user_id, stream_id)`,
    `CREATE INDEX IF NOT EXISTS idx_usage_command_user_date ON bot_command_usage(command_id, twitch_user_id, used_at)`,
  ];

  for (const sql of usageIndexes) {
    try {
      await execute(sql);
    } catch {
      /* índice já existe */
    }
  }

  const USER_PANEL_CONFIG_TABLE = `
    CREATE TABLE IF NOT EXISTS user_panel_config (
      user_id TEXT PRIMARY KEY,
      overrides TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES streamers(id) ON DELETE CASCADE
    );
  `;

  try {
    await execute(USER_PANEL_CONFIG_TABLE);
  } catch {
    /* tabela já existe */
  }

  try {
    await execute(`
      INSERT OR IGNORE INTO user_panel_config (user_id, overrides, updated_at)
      SELECT streamer_id, overrides, updated_at FROM streamer_panel_config
    `);
  } catch {
    /* migração legacy opcional */
  }

  try {
    await execute(`DROP TABLE IF EXISTS streamer_panel_config`);
  } catch {
    /* ignore */
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
      `${STREAMERS_TABLE}${GAMES_TABLE}${STREAMER_GAMES_TABLE}${STREAMER_MODERATORS_TABLE}${SCHEDULED_STREAMS_TABLE}${BOT_ACTIVE_CHANNELS_TABLE}${BOT_CHANNEL_CONFIG_TABLE}${BOT_COMMANDS_TABLE}${BOT_TIMERS_TABLE}${BOT_BLACKLIST_TERMS_TABLE}${BOT_CHANNEL_HEARTBEAT_TABLE}${ECONOMY_CHANNEL_CONFIG_TABLE}${ECONOMY_POINTS_CONFIG_TABLE}${ECONOMY_LEVELS_CONFIG_TABLE}${CHANNEL_VIEWER_ECONOMY_TABLE}${PLATFORM_USER_COINS_TABLE}${ECONOMY_LIVE_REWARD_CLAIMS_TABLE}${ECONOMY_AUDIT_LOG_TABLE}${STORE_CHANNEL_CONFIG_TABLE}${STORE_CATEGORIES_TABLE}${STORE_PRODUCTS_TABLE}${STORE_REDEMPTIONS_TABLE}${STORE_AUDIT_LOG_TABLE}${STORE_BADGE_DEFINITIONS_TABLE}${STORE_USER_BADGES_TABLE}`
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
      `${STREAMERS_TABLE}${GAMES_TABLE}${STREAMER_GAMES_TABLE}${STREAMER_MODERATORS_TABLE}${SCHEDULED_STREAMS_TABLE}${BOT_ACTIVE_CHANNELS_TABLE}${BOT_CHANNEL_CONFIG_TABLE}${BOT_COMMANDS_TABLE}${BOT_TIMERS_TABLE}${BOT_BLACKLIST_TERMS_TABLE}${BOT_CHANNEL_HEARTBEAT_TABLE}${ECONOMY_CHANNEL_CONFIG_TABLE}${ECONOMY_POINTS_CONFIG_TABLE}${ECONOMY_LEVELS_CONFIG_TABLE}${CHANNEL_VIEWER_ECONOMY_TABLE}${PLATFORM_USER_COINS_TABLE}${ECONOMY_LIVE_REWARD_CLAIMS_TABLE}${ECONOMY_AUDIT_LOG_TABLE}${STORE_CHANNEL_CONFIG_TABLE}${STORE_CATEGORIES_TABLE}${STORE_PRODUCTS_TABLE}${STORE_REDEMPTIONS_TABLE}${STORE_AUDIT_LOG_TABLE}${STORE_BADGE_DEFINITIONS_TABLE}${STORE_USER_BADGES_TABLE}`
    );

    console.log("Local SQLite database initialized ✅");
    dbInstance = drizzleBetter(sqlite);
  }

  return dbInstance;
}

void initializeDatabase();
