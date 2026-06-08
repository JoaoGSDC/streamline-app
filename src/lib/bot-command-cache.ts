import type { BotCommandDto } from "@server/bot/bot-command.types";
import { listActiveBotCommandsForSnapshot } from "./bot-db-queries";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  commands: BotCommandDto[];
  configVersion: number;
  expiresAt: number;
}

const cacheByChannel = new Map<string, CacheEntry>();

export function invalidateCommandCache(channelId: string): void {
  cacheByChannel.delete(channelId);
}

export async function getActiveCommandsCached(
  channelId: string,
  configVersion: number
): Promise<BotCommandDto[]> {
  const now = Date.now();
  const cached = cacheByChannel.get(channelId);

  if (
    cached &&
    cached.configVersion === configVersion &&
    cached.expiresAt > now
  ) {
    return cached.commands;
  }

  const commands = await listActiveBotCommandsForSnapshot(channelId);
  cacheByChannel.set(channelId, {
    commands,
    configVersion,
    expiresAt: now + CACHE_TTL_MS,
  });

  return commands;
}
