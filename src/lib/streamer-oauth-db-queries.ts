import { eq } from "drizzle-orm";
import {
  BROADCAST_OAUTH_SCOPE,
  BOT_CHAT_OAUTH_SCOPE,
} from "@server/bot/bot-twitch-oauth.constants";
import { db } from "./db";
import { streamerTwitchOAuth } from "./schema";

export interface StreamerTwitchOAuthStatus {
  connected: boolean;
  scopes: string[];
  hasBroadcastScope: boolean;
  hasBotScope: boolean;
  twitchUserId: string | null;
  updatedAt: Date | null;
}

function parseScopesJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function mapStreamerOAuthStatus(
  row: typeof streamerTwitchOAuth.$inferSelect | null | undefined
): StreamerTwitchOAuthStatus {
  if (!row?.refreshToken?.trim()) {
    return {
      connected: false,
      scopes: [],
      hasBroadcastScope: false,
      hasBotScope: false,
      twitchUserId: null,
      updatedAt: null,
    };
  }

  const scopes = parseScopesJson(row.scopes);

  return {
    connected: true,
    scopes,
    hasBroadcastScope: scopes.includes(BROADCAST_OAUTH_SCOPE),
    hasBotScope: scopes.includes(BOT_CHAT_OAUTH_SCOPE),
    twitchUserId: row.twitchUserId,
    updatedAt: row.updatedAt,
  };
}

export async function getStreamerTwitchOAuthRow(streamerId: string) {
  const [row] = await db
    .select()
    .from(streamerTwitchOAuth)
    .where(eq(streamerTwitchOAuth.streamerId, streamerId))
    .limit(1);

  return row ?? null;
}

export async function getStreamerTwitchOAuthStatus(
  streamerId: string
): Promise<StreamerTwitchOAuthStatus> {
  const row = await getStreamerTwitchOAuthRow(streamerId);
  return mapStreamerOAuthStatus(row);
}

export async function upsertStreamerTwitchOAuth(input: {
  streamerId: string;
  refreshToken: string;
  scopes: string[];
  twitchUserId: string;
}): Promise<void> {
  const now = new Date();

  await db
    .insert(streamerTwitchOAuth)
    .values({
      streamerId: input.streamerId,
      refreshToken: input.refreshToken.trim(),
      scopes: JSON.stringify(input.scopes),
      twitchUserId: input.twitchUserId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: streamerTwitchOAuth.streamerId,
      set: {
        refreshToken: input.refreshToken.trim(),
        scopes: JSON.stringify(input.scopes),
        twitchUserId: input.twitchUserId,
        updatedAt: now,
      },
    });
}

export async function deleteStreamerTwitchOAuth(streamerId: string): Promise<void> {
  await db
    .delete(streamerTwitchOAuth)
    .where(eq(streamerTwitchOAuth.streamerId, streamerId));
}
