import { db } from "./db";
import { botAuditLog } from "./schema";

export interface BotAuditEntry {
  id: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  targetType: string;
  targetId: string;
  action: string;
  diff?: Record<string, unknown> | null;
}

export async function recordBotAudit(entry: BotAuditEntry): Promise<void> {
  await db.insert(botAuditLog).values({
    id: entry.id,
    streamerId: entry.streamerId,
    actorUserId: entry.actorUserId,
    actorUsername: entry.actorUsername,
    targetType: entry.targetType,
    targetId: entry.targetId,
    action: entry.action,
    diff: entry.diff ? JSON.stringify(entry.diff) : null,
    createdAt: new Date(),
  });
}

export function buildCommandAuditDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>
): Record<string, unknown> {
  if (!before) return { after };

  const changed: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const prev = before[key];
    const next = after[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      changed[key] = { from: prev, to: next };
    }
  }

  return changed;
}
