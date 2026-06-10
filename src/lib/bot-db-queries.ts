import { and, desc, eq, gte, isNotNull, isNull, like, ne } from "drizzle-orm";
import {
  BOT_BUILTIN_CATEGORY_ORDER,
  BOT_BUILTIN_COMMANDS,
  DEPRECATED_BUILTIN_KEYS,
  getBuiltinDefinition,
} from "@server/bot/bot-builtin-commands";
import {
  BOT_TIMER_SCHEDULE_LIVE_ELAPSED,
  resolveFirstRunAfterMinutes,
} from "@lib/bot-timer-schedule";
import {
  mapBotCommandAdvancedFields,
  mapBotCommandPointsEffect,
  serializeCommandPointsEffectField,
  serializeJsonStringArray,
} from "./bot-command-fields";
import { db } from "./db";
import {
  botActiveChannels,
  botBlacklistTerms,
  botChannelConfig,
  botCommandUsage,
  botCommands,
  botTimers,
} from "./schema";
import type {
  BotCommandDto,
  BotCommandUsageDto,
  BotCommandUsagePeriod,
  BotCommandUsageStatsDto,
} from "@server/bot/bot-command.types";
import type { CommandPointsEffect } from "@server/bot/command-points-effect";
import {
  SAFE_TRIGGER,
  sanitizeResponse,
} from "@server/bot/sanitize-response";

export function normalizeBotTrigger(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const normalized = trimmed.startsWith("!") ? trimmed : `!${trimmed}`;
  if (!SAFE_TRIGGER.test(normalized)) {
    throw new Error("INVALID_BOT_TRIGGER");
  }
  return normalized;
}

function sanitizeStoredResponse(
  response: string,
  isAction: boolean
): string {
  return sanitizeResponse(response, isAction).trim();
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

function mapCommandRow(row: typeof botCommands.$inferSelect): BotCommandDto {
  const builtinKey = row.builtinKey ?? null;
  return {
    id: row.id,
    streamerId: row.streamerId,
    trigger: row.trigger,
    response: row.response,
    cooldownSeconds: row.cooldownSeconds,
    enabled: Boolean(row.enabled),
    builtinKey,
    isBuiltin: Boolean(builtinKey),
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    pointsEffect: mapBotCommandPointsEffect(row),
    ...mapBotCommandAdvancedFields(row),
  };
}

function mapCommandUsageRow(
  row: typeof botCommandUsage.$inferSelect
): BotCommandUsageDto {
  return {
    id: row.id,
    commandId: row.commandId,
    channelId: row.channelId,
    twitchUserId: row.twitchUserId,
    twitchLogin: row.twitchLogin ?? null,
    streamId: row.streamId ?? null,
    usedAt: row.usedAt,
  };
}


export async function ensureBuiltinBotCommands(streamerId: string) {
  const now = new Date();

  for (const builtin of BOT_BUILTIN_COMMANDS) {
    const existing = await db
      .select()
      .from(botCommands)
      .where(
        and(
          eq(botCommands.streamerId, streamerId),
          eq(botCommands.builtinKey, builtin.key)
        )
      )
      .limit(1);

    if (existing[0]) {
      continue;
    }

    const dbResponse =
      builtin.defaultResponse?.trim() ||
      builtin.responseTemplate?.trim() ||
      "";

    const minPermission =
      builtin.minRole === "streamer"
        ? "streamer"
        : builtin.minRole === "moderator"
          ? "moderator"
          : "everyone";

    await db.insert(botCommands).values({
      id: `builtin-${builtin.key}-${streamerId}`,
      streamerId,
      trigger: builtin.trigger,
      response: dbResponse,
      cooldownSeconds: builtin.defaultCooldownSeconds,
      enabled: true,
      builtinKey: builtin.key,
      minPermission,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const deprecatedKey of DEPRECATED_BUILTIN_KEYS) {
    await db
      .update(botCommands)
      .set({ enabled: false, updatedAt: now })
      .where(
        and(
          eq(botCommands.streamerId, streamerId),
          eq(botCommands.builtinKey, deprecatedKey)
        )
      );
  }

  await touchBotConfig(streamerId);
}

export function isBuiltinBotCommand(
  command: { builtinKey?: string | null } | null
): boolean {
  return Boolean(command?.builtinKey);
}

export async function listBotCommands(
  streamerId: string,
  options?: { search?: string; page?: number; limit?: number }
) {
  await ensureBuiltinBotCommands(streamerId);

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

  const sorted = allRows.map(mapCommandRow).sort((a, b) => {
    if (a.isBuiltin !== b.isBuiltin) return a.isBuiltin ? -1 : 1;

    if (a.isBuiltin && b.isBuiltin) {
      const defA = a.builtinKey ? getBuiltinDefinition(a.builtinKey) : undefined;
      const defB = b.builtinKey ? getBuiltinDefinition(b.builtinKey) : undefined;
      const catA = defA?.category ?? "general";
      const catB = defB?.category ?? "general";
      const idxA = BOT_BUILTIN_CATEGORY_ORDER.indexOf(catA);
      const idxB = BOT_BUILTIN_CATEGORY_ORDER.indexOf(catB);
      if (idxA !== idxB) return idxA - idxB;
    }

    return a.trigger.localeCompare(b.trigger);
  });

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

  return rows.map((row) => {
    const mapped = mapCommandRow(row);
    if (!mapped.builtinKey) return mapped;

    const definition = getBuiltinDefinition(mapped.builtinKey);
    if (!definition) return mapped;

    return {
      ...mapped,
      builtinMeta: {
        category: definition.category,
        minRole: definition.minRole,
        executionKind: definition.executionKind,
        argsHint: definition.argsHint ?? null,
        customizableResponse: definition.customizableResponse,
        runtimeNotes: definition.runtimeNotes ?? null,
        externalApiUrlTemplate: definition.externalApiUrlTemplate ?? null,
        responseTemplate: definition.responseTemplate ?? null,
        requiresConfirmation: definition.requiresConfirmation ?? false,
        confirmationPrompt: definition.confirmationPrompt ?? null,
        economyRewardKey: definition.economyRewardKey ?? null,
        economyRewardPoints: definition.economyRewardPoints ?? null,
        economyBalanceCommand: definition.economyBalanceCommand ?? false,
      },
    };
  });
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

export type BotCommandWriteAdvancedFields = Partial<{
  userCooldown: number;
  minPermission: string;
  bypassCooldownFor: string[];
  maxUsesPerStream: number;
  maxUsesPerUserPerStream: number;
  seasonalLimitType: string;
  seasonalLimitAmount: number;
  seasonalLimitDays: number;
  requiresConfirmation: boolean;
  isActionResponse: boolean;
  isCaseSensitive: boolean;
  aliases: string[];
  argValidationType: string;
  argRegexPattern: string | null;
  argValidationError: string | null;
  responseType: string;
  responseAlternatives: string[];
  pointsEffect?: CommandPointsEffect | null;
  cooldownMessage?: string | null;
}>;

function applyAdvancedFieldsToPatch(
  patch: Partial<typeof botCommands.$inferInsert>,
  data: BotCommandWriteAdvancedFields
) {
  if (data.userCooldown !== undefined) patch.userCooldown = data.userCooldown;
  if (data.minPermission !== undefined) patch.minPermission = data.minPermission;
  if (data.bypassCooldownFor !== undefined) {
    patch.bypassCooldownFor = serializeJsonStringArray(data.bypassCooldownFor);
  }
  if (data.maxUsesPerStream !== undefined) {
    patch.maxUsesPerStream = data.maxUsesPerStream;
  }
  if (data.maxUsesPerUserPerStream !== undefined) {
    patch.maxUsesPerUserPerStream = data.maxUsesPerUserPerStream;
  }
  if (data.seasonalLimitType !== undefined) {
    patch.seasonalLimitType = data.seasonalLimitType;
  }
  if (data.seasonalLimitAmount !== undefined) {
    patch.seasonalLimitAmount = data.seasonalLimitAmount;
  }
  if (data.seasonalLimitDays !== undefined) {
    patch.seasonalLimitDays = data.seasonalLimitDays;
  }
  if (data.requiresConfirmation !== undefined) {
    patch.requiresConfirmation = data.requiresConfirmation;
  }
  if (data.isActionResponse !== undefined) {
    patch.isActionResponse = data.isActionResponse;
  }
  if (data.isCaseSensitive !== undefined) {
    patch.isCaseSensitive = data.isCaseSensitive;
  }
  if (data.aliases !== undefined) {
    patch.aliases = serializeJsonStringArray(
      data.aliases.map((alias) => normalizeBotTrigger(alias))
    );
  }
  if (data.argValidationType !== undefined) {
    patch.argValidationType = data.argValidationType;
  }
  if (data.argRegexPattern !== undefined) {
    patch.argRegexPattern = data.argRegexPattern;
  }
  if (data.argValidationError !== undefined) {
    patch.argValidationError = data.argValidationError;
  }
  if (data.responseType !== undefined) patch.responseType = data.responseType;
  if (data.responseAlternatives !== undefined) {
    patch.responseAlternatives = serializeJsonStringArray(
      data.responseAlternatives
    );
  }
  if (data.pointsEffect !== undefined) {
    patch.pointsEffect = serializeCommandPointsEffectField(data.pointsEffect);
  }
  if (data.cooldownMessage !== undefined) {
    patch.cooldownMessage = data.cooldownMessage?.trim() || null;
  }
}

/** Retorna o trigger normalizado em conflito, ou null se livre. */
export async function findBotCommandTriggerConflict(
  streamerId: string,
  triggers: string[],
  excludeId?: string
): Promise<string | null> {
  const normalizedTargets = triggers.map((trigger) => normalizeBotTrigger(trigger));
  const seen = new Set<string>();
  for (const target of normalizedTargets) {
    if (seen.has(target)) return target;
    seen.add(target);
  }

  const rows = await db
    .select()
    .from(botCommands)
    .where(
      and(eq(botCommands.streamerId, streamerId), isNull(botCommands.deletedAt))
    );

  for (const row of rows) {
    if (excludeId && row.id === excludeId) continue;

    const advanced = mapBotCommandAdvancedFields(row);
    const occupied = [
      normalizeBotTrigger(row.trigger),
      ...advanced.aliases.map((alias) => normalizeBotTrigger(alias)),
    ];

    for (const target of normalizedTargets) {
      if (occupied.includes(target)) return target;
    }
  }

  return null;
}

export async function getBotCommandUsageStats(
  commandId: string,
  channelId: string,
  period: BotCommandUsagePeriod
): Promise<BotCommandUsageStatsDto> {
  const empty: BotCommandUsageStatsDto = {
    commandId,
    period,
    totalUses: 0,
    uniqueUsers: 0,
    topUsers: [],
  };

  const conditions = [
    eq(botCommandUsage.commandId, commandId),
    eq(botCommandUsage.channelId, channelId),
  ];

  if (period === "stream") {
    const latestStream = await db
      .select()
      .from(botCommandUsage)
      .where(
        and(
          eq(botCommandUsage.commandId, commandId),
          eq(botCommandUsage.channelId, channelId),
          isNotNull(botCommandUsage.streamId)
        )
      )
      .orderBy(desc(botCommandUsage.usedAt))
      .limit(1);

    const streamId = latestStream[0]?.streamId;
    if (!streamId) return empty;
    conditions.push(eq(botCommandUsage.streamId, streamId));
  } else {
    const windowMs =
      period === "day"
        ? 24 * 60 * 60 * 1000
        : period === "week"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
    conditions.push(gte(botCommandUsage.usedAt, new Date(Date.now() - windowMs)));
  }

  const rows = await db
    .select()
    .from(botCommandUsage)
    .where(and(...conditions));

  const userCounts = new Map<string, { login: string; count: number }>();
  const uniqueUserIds = new Set<string>();

  for (const row of rows) {
    uniqueUserIds.add(row.twitchUserId);
    const login = row.twitchLogin?.trim() || row.twitchUserId;
    const current = userCounts.get(row.twitchUserId);
    if (current) {
      current.count += 1;
    } else {
      userCounts.set(row.twitchUserId, { login, count: 1 });
    }
  }

  const topUsers = [...userCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ login, count }) => ({ login, count }));

  return {
    commandId,
    period,
    totalUses: rows.length,
    uniqueUsers: uniqueUserIds.size,
    topUsers,
  };
}

export async function createBotCommand(data: {
  id: string;
  streamerId: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
} & BotCommandWriteAdvancedFields) {
  const now = new Date();
  const values: typeof botCommands.$inferInsert = {
    id: data.id,
    streamerId: data.streamerId,
    trigger: normalizeBotTrigger(data.trigger),
    response: sanitizeStoredResponse(
      data.response,
      data.isActionResponse ?? false
    ),
    cooldownSeconds: data.cooldownSeconds,
    enabled: data.enabled,
    createdAt: now,
    updatedAt: now,
  };

  applyAdvancedFieldsToPatch(values, data);

  const [row] = await db.insert(botCommands).values(values).returning();

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
  }> &
    BotCommandWriteAdvancedFields
) {
  const patch: Partial<typeof botCommands.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.trigger !== undefined) {
    patch.trigger = normalizeBotTrigger(data.trigger);
  }
  if (data.response !== undefined) {
    patch.response = sanitizeStoredResponse(
      data.response,
      data.isActionResponse ?? false
    );
  }
  if (data.cooldownSeconds !== undefined) {
    patch.cooldownSeconds = data.cooldownSeconds;
  }
  if (data.enabled !== undefined) {
    patch.enabled = data.enabled;
  }

  applyAdvancedFieldsToPatch(patch, data);

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
  const existing = await getBotCommandById(id, streamerId);
  if (isBuiltinBotCommand(existing)) {
    throw new Error("BUILTIN_COMMAND_NOT_DELETABLE");
  }

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
  const intervalMinutes = row.intervalMinutes;
  const firstRunAfterMinutes = resolveFirstRunAfterMinutes(
    intervalMinutes,
    row.firstRunAfterMinutes
  );

  return {
    id: row.id,
    streamerId: row.streamerId,
    name: row.name,
    intervalMinutes,
    firstRunAfterMinutes,
    scheduleMode: row.scheduleMode ?? BOT_TIMER_SCHEDULE_LIVE_ELAPSED,
    message: row.message,
    minViewers: row.minViewers ?? null,
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
  firstRunAfterMinutes?: number;
  scheduleMode?: string;
  message: string;
  minViewers?: number | null;
  enabled: boolean;
}) {
  const now = new Date();
  const intervalMinutes = data.intervalMinutes;
  const firstRunAfterMinutes = resolveFirstRunAfterMinutes(
    intervalMinutes,
    data.firstRunAfterMinutes
  );

  const [row] = await db
    .insert(botTimers)
    .values({
      id: data.id,
      streamerId: data.streamerId,
      name: data.name?.trim() || null,
      intervalMinutes,
      firstRunAfterMinutes,
      scheduleMode: data.scheduleMode ?? BOT_TIMER_SCHEDULE_LIVE_ELAPSED,
      message: data.message.trim(),
      minViewers: data.minViewers ?? null,
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
    firstRunAfterMinutes: number;
    scheduleMode: string;
    message: string;
    minViewers: number | null;
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
  if (data.firstRunAfterMinutes !== undefined) {
    patch.firstRunAfterMinutes = data.firstRunAfterMinutes;
  }
  if (data.scheduleMode !== undefined) patch.scheduleMode = data.scheduleMode;
  if (data.message !== undefined) patch.message = data.message.trim();
  if (data.minViewers !== undefined) patch.minViewers = data.minViewers;
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

export async function getBotActiveChannel(streamerId: string) {
  const rows = await db
    .select()
    .from(botActiveChannels)
    .where(eq(botActiveChannels.streamerId, streamerId))
    .limit(1);
  return rows[0] ?? null;
}

export async function isBotChannelActive(streamerId: string): Promise<boolean> {
  const row = await getBotActiveChannel(streamerId);
  return Boolean(row && row.deactivatedAt == null);
}

export async function listActiveBotChannelsForService() {
  const rows = await db
    .select()
    .from(botActiveChannels)
    .where(isNull(botActiveChannels.deactivatedAt));

  return rows.map((row) => ({
    streamerId: row.streamerId,
    twitchUsername: row.twitchUsername,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function activateBotChannel(
  streamerId: string,
  twitchUsername: string
) {
  const now = new Date();
  const normalizedUsername = twitchUsername.trim().toLowerCase();
  const existing = await getBotActiveChannel(streamerId);

  if (existing) {
    await db
      .update(botActiveChannels)
      .set({
        twitchUsername: normalizedUsername,
        deactivatedAt: null,
        updatedAt: now,
      })
      .where(eq(botActiveChannels.streamerId, streamerId));

    await ensureBuiltinBotCommands(streamerId);
    await touchBotConfig(streamerId);

    return {
      streamerId,
      twitchUsername: normalizedUsername,
      active: true,
      createdAt: existing.createdAt,
      updatedAt: now,
      reactivated: true,
    };
  }

  await db.insert(botActiveChannels).values({
    streamerId,
    twitchUsername: normalizedUsername,
    createdAt: now,
    updatedAt: now,
    deactivatedAt: null,
  });

  await ensureBuiltinBotCommands(streamerId);
  await touchBotConfig(streamerId);

  return {
    streamerId,
    twitchUsername: normalizedUsername,
    active: true,
    createdAt: now,
    updatedAt: now,
    reactivated: false,
  };
}

export async function deactivateBotChannel(streamerId: string) {
  const existing = await getBotActiveChannel(streamerId);
  if (!existing || existing.deactivatedAt != null) {
    return null;
  }

  const now = new Date();
  await db
    .update(botActiveChannels)
    .set({ deactivatedAt: now, updatedAt: now })
    .where(eq(botActiveChannels.streamerId, streamerId));

  await touchBotConfig(streamerId);

  return {
    streamerId,
    twitchUsername: existing.twitchUsername,
    active: false,
    deactivatedAt: now,
  };
}
