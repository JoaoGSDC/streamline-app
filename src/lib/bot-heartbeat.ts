import { eq } from "drizzle-orm";
import { db } from "./db";
import { botChannelHeartbeat } from "./schema";

export type BotHeartbeatIrcStatus = "connected" | "disconnected" | "degraded";

export interface BotHeartbeatChannel {
  streamerId: string;
  twitchUsername: string;
  ircStatus: BotHeartbeatIrcStatus;
  configVersion: number;
}

export interface BotHeartbeatPayload {
  version: string;
  uptimeSeconds: number;
  channels: BotHeartbeatChannel[];
  recentErrors: string[];
}

export interface StoredBotHeartbeat extends BotHeartbeatPayload {
  receivedAt: Date;
}

export async function saveBotHeartbeat(
  payload: BotHeartbeatPayload
): Promise<StoredBotHeartbeat> {
  const receivedAt = new Date();
  const recentErrors = JSON.stringify(payload.recentErrors);

  for (const channel of payload.channels) {
    await db
      .insert(botChannelHeartbeat)
      .values({
        streamerId: channel.streamerId,
        twitchUsername: channel.twitchUsername,
        ircStatus: channel.ircStatus,
        configVersion: channel.configVersion,
        botVersion: payload.version,
        uptimeSeconds: payload.uptimeSeconds,
        recentErrors,
        receivedAt,
      })
      .onConflictDoUpdate({
        target: botChannelHeartbeat.streamerId,
        set: {
          twitchUsername: channel.twitchUsername,
          ircStatus: channel.ircStatus,
          configVersion: channel.configVersion,
          botVersion: payload.version,
          uptimeSeconds: payload.uptimeSeconds,
          recentErrors,
          receivedAt,
        },
      });
  }

  return { ...payload, receivedAt };
}

export async function getRecentBotHeartbeat(
  streamerId: string,
  maxAgeMs = 90_000
): Promise<StoredBotHeartbeat | null> {
  const rows = await db
    .select()
    .from(botChannelHeartbeat)
    .where(eq(botChannelHeartbeat.streamerId, streamerId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (Date.now() - row.receivedAt.getTime() > maxAgeMs) return null;

  let recentErrors: string[] = [];
  try {
    recentErrors = JSON.parse(row.recentErrors) as string[];
  } catch {
    recentErrors = [];
  }

  return {
    version: row.botVersion,
    uptimeSeconds: row.uptimeSeconds,
    channels: [
      {
        streamerId: row.streamerId,
        twitchUsername: row.twitchUsername,
        ircStatus: row.ircStatus as BotHeartbeatIrcStatus,
        configVersion: row.configVersion,
      },
    ],
    recentErrors,
    receivedAt: row.receivedAt,
  };
}
