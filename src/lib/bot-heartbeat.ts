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

const lastHeartbeatByStreamerId = new Map<string, StoredBotHeartbeat>();

export function saveBotHeartbeat(payload: BotHeartbeatPayload): StoredBotHeartbeat {
  const stored: StoredBotHeartbeat = {
    ...payload,
    receivedAt: new Date(),
  };

  for (const channel of payload.channels) {
    lastHeartbeatByStreamerId.set(channel.streamerId, stored);
  }

  return stored;
}

export function getRecentBotHeartbeat(streamerId: string, maxAgeMs = 90_000) {
  const heartbeat = lastHeartbeatByStreamerId.get(streamerId);
  if (!heartbeat) return null;
  if (Date.now() - heartbeat.receivedAt.getTime() > maxAgeMs) return null;
  return heartbeat;
}
