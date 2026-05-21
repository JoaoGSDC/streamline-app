import { and, eq, isNull, like, ne } from "drizzle-orm";
import { db } from "./db";
import {
  botBlacklistTerms,
  botChannelConfig,
  botCommands,
  botTimers,
} from "./schema";

export function normalizeBotTrigger(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  return trimmed.startsWith("!") ? trimmed : `!${trimmed}`;
}

export function normalizeBlacklistTerm(raw: string): string {
  return raw.trim().toLowerCase();
}

async function bumpBotConfigVersion(streamerId: string): Promise<number> {
  const now = new Date();
  const existing = await db
    .select()
    .from(botChannelConfig)
    .where(eq(botChannelConfig.streamerId, streamerId))
    .limit(1);

  if (existing[0]) {
    const nextVersion = existing[0].configVersion + 1;
    await db
      .update(botChannelConfig)
      .set({ configVersion: nextVersion, updatedAt: now })
      .where(eq(botChannelConfig.streamerId, streamerId));
    return nextVersion;
  }

  await db.insert(botChannelConfig).values({
    streamerId,
    configVersion: 1,
    updatedAt: now,
  });
  return 1;
}

export async function getBotConfigVersion(streamerId: string): Promise<number> {
  const row = await db
    .select()
    .from(botChannelConfig)
    .where(eq(botChannelConfig.streamerId, streamerId))
    .limit(1);
  return row[0]?.configVersion ?? 0;
}

export async function touchBotConfig(streamerId: string): Promise<number> {
  return bumpBotConfigVersion(streamerId);
}

function mapCommandRow(row: typeof botCommands.$inferSelect) {
  return {
    id: row.id,
    streamerId: row.streamerId,
    trigger: row.trigger,
    response: row.response,
    cooldownSeconds: row.cooldownSeconds,
    enabled: Boolean(row.enabled),
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

export async function listBotCommands(
  streamerId: string,
  options?: { search?: string; page?: number; limit?: number }
) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
  const offset = (page - 1) * limit;
  const search = options?.search?.trim().toLowerCase();

  const conditions = [
    eq(botCommands.streamerId, streamerId),
    isNull(botCommands.deletedAt),
  ];

  if (search) {
    conditions.push(like(botCommands.trigger, `%${search}%`));
  }

  const allRows = await db
    .select()
    .from(botCommands)
    .where(and(...conditions));

  const sorted = allRows
    .map(mapCommandRow)
    .sort((a, b) => a.trigger.localeCompare(b.trigger));

  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
    page,
    limit,
  };
}

export async function listActiveBotCommandsForSnapshot(streamerId: string) {
  const rows = await db
    .select()
    .from(botCommands)
    .where(
      and(
        eq(botCommands.streamerId, streamerId),
        isNull(botCommands.deletedAt),
        eq(botCommands.enabled, true)
      )
    )
    .orderBy(botCommands.trigger);

  return rows.map(mapCommandRow);
}

export async function getBotCommandById(id: string, streamerId: string) {
  const rows = await db
    .select()
    .from(botCommands)
    .where(
      and(
        eq(botCommands.id, id),
        eq(botCommands.streamerId, streamerId),
        isNull(botCommands.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  return row ? mapCommandRow(row) : null;
}

export async function getBotCommandByTrigger(
  streamerId: string,
  trigger: string,
  excludeId?: string
) {
  const normalized = normalizeBotTrigger(trigger);
  const rows = await db
    .select()
    .from(botCommands)
    .where(
      and(
        eq(botCommands.streamerId, streamerId),
        eq(botCommands.trigger, normalized),
        isNull(botCommands.deletedAt),
        ...(excludeId ? [ne(botCommands.id, excludeId)] : [])
      )
    )
    .limit(1);

  const row = rows[0];
  return row ? mapCommandRow(row) : null;
}

export async function createBotCommand(data: {
  id: string;
  streamerId: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
}) {
  const now = new Date();
  const [row] = await db
    .insert(botCommands)
    .values({
      id: data.id,
      streamerId: data.streamerId,
      trigger: normalizeBotTrigger(data.trigger),
      response: data.response.trim(),
      cooldownSeconds: data.cooldownSeconds,
      enabled: data.enabled,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const configVersion = await touchBotConfig(data.streamerId);
  return { command: mapCommandRow(row), configVersion };
}

export async function updateBotCommand(
  id: string,
  streamerId: string,
  data: Partial<{
    trigger: string;
    response: string;
    cooldownSeconds: number;
    enabled: boolean;
  }>
) {
  const patch: Partial<typeof botCommands.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.trigger !== undefined) {
    patch.trigger = normalizeBotTrigger(data.trigger);
  }
  if (data.response !== undefined) {
    patch.response = data.response.trim();
  }
  if (data.cooldownSeconds !== undefined) {
    patch.cooldownSeconds = data.cooldownSeconds;
  }
  if (data.enabled !== undefined) {
    patch.enabled = data.enabled;
  }

  await db
    .update(botCommands)
    .set(patch)
    .where(
      and(
        eq(botCommands.id, id),
        eq(botCommands.streamerId, streamerId),
        isNull(botCommands.deletedAt)
      )
    );

  const configVersion = await touchBotConfig(streamerId);
  const command = await getBotCommandById(id, streamerId);
  return { command, configVersion };
}

export async function softDeleteBotCommand(id: string, streamerId: string) {
  await db
    .update(botCommands)
    .set({ deletedAt: new Date(), updatedAt: new Date(), enabled: false })
    .where(
      and(
        eq(botCommands.id, id),
        eq(botCommands.streamerId, streamerId),
        isNull(botCommands.deletedAt)
      )
    );

  const configVersion = await touchBotConfig(streamerId);
  return { configVersion };
}

function mapTimerRow(row: typeof botTimers.$inferSelect) {
  return {
    id: row.id,
    streamerId: row.streamerId,
    name: row.name,
    intervalMinutes: row.intervalMinutes,
    message: row.message,
    enabled: Boolean(row.enabled),
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

export async function listBotTimers(streamerId: string) {
  const rows = await db
    .select()
    .from(botTimers)
    .where(and(eq(botTimers.streamerId, streamerId), isNull(botTimers.deletedAt)))
    .orderBy(botTimers.name);

  return rows.map(mapTimerRow);
}

export async function listActiveBotTimersForSnapshot(streamerId: string) {
  const rows = await db
    .select()
    .from(botTimers)
    .where(
      and(
        eq(botTimers.streamerId, streamerId),
        isNull(botTimers.deletedAt),
        eq(botTimers.enabled, true)
      )
    );

  return rows.map(mapTimerRow);
}

export async function getBotTimerById(id: string, streamerId: string) {
  const rows = await db
    .select()
    .from(botTimers)
    .where(
      and(
        eq(botTimers.id, id),
        eq(botTimers.streamerId, streamerId),
        isNull(botTimers.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  return row ? mapTimerRow(row) : null;
}

export async function createBotTimer(data: {
  id: string;
  streamerId: string;
  name?: string | null;
  intervalMinutes: number;
  message: string;
  enabled: boolean;
}) {
  const now = new Date();
  const [row] = await db
    .insert(botTimers)
    .values({
      id: data.id,
      streamerId: data.streamerId,
      name: data.name?.trim() || null,
      intervalMinutes: data.intervalMinutes,
      message: data.message.trim(),
      enabled: data.enabled,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const configVersion = await touchBotConfig(data.streamerId);
  return { timer: mapTimerRow(row), configVersion };
}

export async function updateBotTimer(
  id: string,
  streamerId: string,
  data: Partial<{
    name: string | null;
    intervalMinutes: number;
    message: string;
    enabled: boolean;
  }>
) {
  const patch: Partial<typeof botTimers.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) patch.name = data.name?.trim() || null;
  if (data.intervalMinutes !== undefined) {
    patch.intervalMinutes = data.intervalMinutes;
  }
  if (data.message !== undefined) patch.message = data.message.trim();
  if (data.enabled !== undefined) patch.enabled = data.enabled;

  await db
    .update(botTimers)
    .set(patch)
    .where(
      and(
        eq(botTimers.id, id),
        eq(botTimers.streamerId, streamerId),
        isNull(botTimers.deletedAt)
      )
    );

  const configVersion = await touchBotConfig(streamerId);
  const timer = await getBotTimerById(id, streamerId);
  return { timer, configVersion };
}

export async function softDeleteBotTimer(id: string, streamerId: string) {
  await db
    .update(botTimers)
    .set({ deletedAt: new Date(), updatedAt: new Date(), enabled: false })
    .where(
      and(
        eq(botTimers.id, id),
        eq(botTimers.streamerId, streamerId),
        isNull(botTimers.deletedAt)
      )
    );

  const configVersion = await touchBotConfig(streamerId);
  return { configVersion };
}

function mapBlacklistRow(row: typeof botBlacklistTerms.$inferSelect) {
  return {
    id: row.id,
    streamerId: row.streamerId,
    term: row.term,
    matchType: row.matchType as "exact" | "contains",
    action: row.action as "delete" | "timeout",
    timeoutSeconds: row.timeoutSeconds,
    enabled: Boolean(row.enabled),
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

export async function listBotBlacklistTerms(
  streamerId: string,
  search?: string
) {
  const termSearch = search?.trim().toLowerCase();
  const conditions = [
    eq(botBlacklistTerms.streamerId, streamerId),
    isNull(botBlacklistTerms.deletedAt),
  ];

  if (termSearch) {
    conditions.push(like(botBlacklistTerms.term, `%${termSearch}%`));
  }

  const rows = await db
    .select()
    .from(botBlacklistTerms)
    .where(and(...conditions))
    .orderBy(botBlacklistTerms.term);

  return rows.map(mapBlacklistRow);
}

export async function listActiveBotBlacklistForSnapshot(streamerId: string) {
  const rows = await db
    .select()
    .from(botBlacklistTerms)
    .where(
      and(
        eq(botBlacklistTerms.streamerId, streamerId),
        isNull(botBlacklistTerms.deletedAt),
        eq(botBlacklistTerms.enabled, true)
      )
    );

  return rows.map(mapBlacklistRow);
}

export async function getBotBlacklistTermById(id: string, streamerId: string) {
  const rows = await db
    .select()
    .from(botBlacklistTerms)
    .where(
      and(
        eq(botBlacklistTerms.id, id),
        eq(botBlacklistTerms.streamerId, streamerId),
        isNull(botBlacklistTerms.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  return row ? mapBlacklistRow(row) : null;
}

export async function getBotBlacklistByTerm(
  streamerId: string,
  term: string,
  excludeId?: string
) {
  const normalized = normalizeBlacklistTerm(term);
  const rows = await db
    .select()
    .from(botBlacklistTerms)
    .where(
      and(
        eq(botBlacklistTerms.streamerId, streamerId),
        eq(botBlacklistTerms.term, normalized),
        isNull(botBlacklistTerms.deletedAt),
        ...(excludeId ? [ne(botBlacklistTerms.id, excludeId)] : [])
      )
    )
    .limit(1);

  const row = rows[0];
  return row ? mapBlacklistRow(row) : null;
}

export async function createBotBlacklistTerm(data: {
  id: string;
  streamerId: string;
  term: string;
  matchType: "exact" | "contains";
  action: "delete" | "timeout";
  timeoutSeconds?: number | null;
  enabled: boolean;
}) {
  const now = new Date();
  const [row] = await db
    .insert(botBlacklistTerms)
    .values({
      id: data.id,
      streamerId: data.streamerId,
      term: normalizeBlacklistTerm(data.term),
      matchType: data.matchType,
      action: data.action,
      timeoutSeconds:
        data.action === "timeout" ? (data.timeoutSeconds ?? 300) : null,
      enabled: data.enabled,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const configVersion = await touchBotConfig(data.streamerId);
  return { term: mapBlacklistRow(row), configVersion };
}

export async function updateBotBlacklistTerm(
  id: string,
  streamerId: string,
  data: Partial<{
    term: string;
    matchType: "exact" | "contains";
    action: "delete" | "timeout";
    timeoutSeconds: number | null;
    enabled: boolean;
  }>
) {
  const patch: Partial<typeof botBlacklistTerms.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.term !== undefined) {
    patch.term = normalizeBlacklistTerm(data.term);
  }
  if (data.matchType !== undefined) patch.matchType = data.matchType;
  if (data.action !== undefined) {
    patch.action = data.action;
    patch.timeoutSeconds =
      data.action === "timeout"
        ? (data.timeoutSeconds ?? 300)
        : null;
  } else if (data.timeoutSeconds !== undefined) {
    patch.timeoutSeconds = data.timeoutSeconds;
  }
  if (data.enabled !== undefined) patch.enabled = data.enabled;

  await db
    .update(botBlacklistTerms)
    .set(patch)
    .where(
      and(
        eq(botBlacklistTerms.id, id),
        eq(botBlacklistTerms.streamerId, streamerId),
        isNull(botBlacklistTerms.deletedAt)
      )
    );

  const configVersion = await touchBotConfig(streamerId);
  const term = await getBotBlacklistTermById(id, streamerId);
  return { term, configVersion };
}

export async function softDeleteBotBlacklistTerm(
  id: string,
  streamerId: string
) {
  await db
    .update(botBlacklistTerms)
    .set({ deletedAt: new Date(), updatedAt: new Date(), enabled: false })
    .where(
      and(
        eq(botBlacklistTerms.id, id),
        eq(botBlacklistTerms.streamerId, streamerId),
        isNull(botBlacklistTerms.deletedAt)
      )
    );

  const configVersion = await touchBotConfig(streamerId);
  return { configVersion };
}

export async function countBotCommands(streamerId: string): Promise<number> {
  const rows = await listActiveBotCommandsForSnapshot(streamerId);
  return rows.length;
}

export async function countBotTimers(streamerId: string): Promise<number> {
  const rows = await listActiveBotTimersForSnapshot(streamerId);
  return rows.length;
}

export async function countBotBlacklist(streamerId: string): Promise<number> {
  const rows = await listActiveBotBlacklistForSnapshot(streamerId);
  return rows.length;
}
