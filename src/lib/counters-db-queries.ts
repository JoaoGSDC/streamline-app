import { and, desc, eq, gte, isNull, like, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  counterCategories,
  counterHistory,
  counters,
  countersChannelConfig,
} from "./schema";
import type {
  BotAdjustCounterInput,
  CounterBotSnapshot,
  CounterCategoryDto,
  CounterDto,
  CounterHistoryEntryDto,
  CounterListFilters,
  CounterOperation,
  CounterOverlayConfig,
  CountersChannelConfigDto,
  CountersDashboardDto,
  CountersListResult,
  CreateCounterInput,
  CounterChangeSource,
} from "@server/counters/counters.types";
import { slugifyCounterText } from "@server/counters/counters.validators";
import { HttpError } from "@server/utils/http-error";
import { touchBotConfig } from "./bot-db-queries";
import { createRandomString } from "@utils/factories/create-random-string";

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseOverlayConfig(raw: string | null | undefined): CounterOverlayConfig {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as CounterOverlayConfig) : {};
  } catch {
    return {};
  }
}

async function bumpCountersConfigVersion(streamerId: string) {
  const now = new Date();
  await db
    .update(countersChannelConfig)
    .set({
      configVersion: sql`${countersChannelConfig.configVersion} + 1`,
      updatedAt: now,
    })
    .where(eq(countersChannelConfig.streamerId, streamerId));
}

async function ensureCountersConfig(streamerId: string): Promise<CountersChannelConfigDto> {
  const existing = await db
    .select()
    .from(countersChannelConfig)
    .where(eq(countersChannelConfig.streamerId, streamerId))
    .limit(1);

  if (existing[0]) {
    return mapConfigRow(existing[0]);
  }

  const now = new Date();
  await db.insert(countersChannelConfig).values({
    streamerId,
    enabled: true,
    configVersion: 1,
    liveModePins: "[]",
    createdAt: now,
    updatedAt: now,
  });

  return {
    streamerId,
    enabled: true,
    configVersion: 1,
    liveModePins: [],
    createdAt: now,
    updatedAt: now,
  };
}

function mapConfigRow(
  row: typeof countersChannelConfig.$inferSelect
): CountersChannelConfigDto {
  return {
    streamerId: row.streamerId,
    enabled: Boolean(row.enabled),
    configVersion: row.configVersion,
    liveModePins: parseJsonArray(row.liveModePins),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCounterRow(
  row: typeof counters.$inferSelect,
  categoryName: string | null = null
): CounterDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    categoryId: row.categoryId,
    categoryName,
    slug: row.slug,
    name: row.name,
    description: row.description,
    type: row.type as CounterDto["type"],
    value: row.value,
    minValue: row.minValue,
    maxValue: row.maxValue,
    goalValue: row.goalValue,
    goalReachedAt: row.goalReachedAt,
    color: row.color,
    icon: row.icon,
    emoji: row.emoji,
    tags: parseJsonArray(row.tags),
    visibility: row.visibility,
    status: row.status as CounterDto["status"],
    resetPolicy: row.resetPolicy as CounterDto["resetPolicy"],
    overlayConfig: parseOverlayConfig(row.overlayConfig),
    sortOrder: row.sortOrder,
    useCount: row.useCount,
    lastChangedAt: row.lastChangedAt,
    lastChangedBy: row.lastChangedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapHistoryRow(row: typeof counterHistory.$inferSelect): CounterHistoryEntryDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    counterId: row.counterId,
    counterSlug: row.counterSlug,
    counterName: row.counterName,
    previousValue: row.previousValue,
    newValue: row.newValue,
    delta: row.delta,
    operation: row.operation as CounterHistoryEntryDto["operation"],
    source: row.source as CounterHistoryEntryDto["source"],
    actorUserId: row.actorUserId,
    actorUsername: row.actorUsername,
    actorDisplayName: row.actorDisplayName,
    createdAt: row.createdAt,
  };
}

async function syncBotAfterCounterChange(streamerId: string) {
  await ensureCountersConfig(streamerId);
  await bumpCountersConfigVersion(streamerId);
  await touchBotConfig(streamerId);
}

function clampValue(
  value: number,
  min: number | null,
  max: number | null
): number {
  let result = value;
  if (min !== null && result < min) result = min;
  if (max !== null && result > max) result = max;
  return result;
}

function resolveNewValue(
  counter: CounterDto,
  operation: CounterOperation,
  amount?: number
): number {
  const delta = amount ?? 1;
  switch (operation) {
    case "increment":
      return clampValue(counter.value + delta, counter.minValue, counter.maxValue);
    case "decrement":
      return clampValue(counter.value - delta, counter.minValue, counter.maxValue);
    case "set":
      if (amount === undefined) {
        throw new HttpError("Valor obrigatório para operação set", 400, "VALIDATION_ERROR");
      }
      return clampValue(amount, counter.minValue, counter.maxValue);
    case "reset":
      return 0;
    default:
      throw new HttpError("Operação inválida", 400, "VALIDATION_ERROR");
  }
}

export async function getCountersConfig(streamerId: string): Promise<CountersChannelConfigDto> {
  return ensureCountersConfig(streamerId);
}

export async function getCountersConfigVersion(streamerId: string): Promise<number> {
  const config = await ensureCountersConfig(streamerId);
  return config.configVersion;
}

export async function updateCountersConfig(
  streamerId: string,
  patch: Partial<Pick<CountersChannelConfigDto, "enabled" | "liveModePins">>
): Promise<CountersChannelConfigDto> {
  await ensureCountersConfig(streamerId);
  const now = new Date();
  const updates: Partial<typeof countersChannelConfig.$inferInsert> = { updatedAt: now };

  if (patch.enabled !== undefined) updates.enabled = patch.enabled;
  if (patch.liveModePins !== undefined) {
    updates.liveModePins = JSON.stringify(patch.liveModePins);
  }

  await db
    .update(countersChannelConfig)
    .set(updates)
    .where(eq(countersChannelConfig.streamerId, streamerId));

  await bumpCountersConfigVersion(streamerId);
  return getCountersConfig(streamerId);
}

export async function listCounterCategories(
  streamerId: string
): Promise<{ items: CounterCategoryDto[] }> {
  const rows = await db
    .select()
    .from(counterCategories)
    .where(
      and(eq(counterCategories.streamerId, streamerId), isNull(counterCategories.deletedAt))
    )
    .orderBy(counterCategories.sortOrder, counterCategories.name);

  const items: CounterCategoryDto[] = rows.map((row) => ({
    id: row.id,
    streamerId: row.streamerId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return { items };
}

export async function createCounterCategory(
  streamerId: string,
  input: { name: string; slug?: string; description?: string | null; color?: string | null; icon?: string | null }
): Promise<CounterCategoryDto> {
  const slug = input.slug?.trim() || slugifyCounterText(input.name);
  const now = new Date();
  const id = createRandomString();

  await db.insert(counterCategories).values({
    id,
    streamerId,
    slug,
    name: input.name.trim(),
    description: input.description ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  });

  const created = (await listCounterCategories(streamerId)).items.find((c) => c.id === id);
  if (!created) throw new HttpError("Falha ao criar categoria", 500);
  return created;
}

export async function listCounters(
  streamerId: string,
  filters: CounterListFilters = {}
): Promise<CountersListResult> {
  const conditions = [
    eq(counters.streamerId, streamerId),
    isNull(counters.deletedAt),
  ];

  if (filters.status) {
    conditions.push(eq(counters.status, filters.status));
  } else {
    conditions.push(eq(counters.status, "active"));
  }

  if (filters.categoryId) {
    conditions.push(eq(counters.categoryId, filters.categoryId));
  }

  if (filters.q?.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(or(like(counters.name, q), like(counters.slug, q))!);
  }

  const rows = await db
    .select()
    .from(counters)
    .leftJoin(counterCategories, eq(counters.categoryId, counterCategories.id))
    .where(and(...conditions))
    .orderBy(counters.sortOrder, counters.name);

  let items = rows.map((row) =>
    mapCounterRow(row.counters, row.counter_categories?.name ?? null)
  );

  if (filters.tag?.trim()) {
    const tag = filters.tag.trim().toLowerCase();
    items = items.filter((item) =>
      item.tags.some((t) => t.toLowerCase() === tag)
    );
  }

  return { items, total: items.length };
}

export async function getCounterById(
  streamerId: string,
  counterId: string
): Promise<CounterDto | null> {
  const rows = await db
    .select()
    .from(counters)
    .leftJoin(counterCategories, eq(counters.categoryId, counterCategories.id))
    .where(
      and(
        eq(counters.streamerId, streamerId),
        eq(counters.id, counterId),
        isNull(counters.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return mapCounterRow(row.counters, row.counter_categories?.name ?? null);
}

export async function getCounterBySlug(
  streamerId: string,
  slug: string
): Promise<CounterDto | null> {
  const rows = await db
    .select()
    .from(counters)
    .leftJoin(counterCategories, eq(counters.categoryId, counterCategories.id))
    .where(
      and(
        eq(counters.streamerId, streamerId),
        eq(counters.slug, slug),
        isNull(counters.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return mapCounterRow(row.counters, row.counter_categories?.name ?? null);
}

export async function createCounter(input: CreateCounterInput): Promise<CounterDto> {
  const slug = input.slug?.trim() || slugifyCounterText(input.name);
  const now = new Date();

  const existing = await getCounterBySlug(input.streamerId, slug);
  if (existing) {
    throw new HttpError("Já existe um contador com este identificador", 409, "DUPLICATE_SLUG");
  }

  await ensureCountersConfig(input.streamerId);

  await db.insert(counters).values({
    id: input.id,
    streamerId: input.streamerId,
    categoryId: input.categoryId ?? null,
    slug,
    name: input.name.trim(),
    description: input.description ?? null,
    type: input.type ?? "incremental",
    value: input.value ?? 0,
    minValue: input.minValue ?? null,
    maxValue: input.maxValue ?? null,
    goalValue: input.goalValue ?? null,
    color: input.color ?? "#6366f1",
    icon: input.icon ?? null,
    emoji: input.emoji ?? null,
    tags: JSON.stringify(input.tags ?? []),
    resetPolicy: input.resetPolicy ?? "manual",
    overlayConfig: JSON.stringify(input.overlayConfig ?? {}),
    createdAt: now,
    updatedAt: now,
  });

  await syncBotAfterCounterChange(input.streamerId);

  const created = await getCounterById(input.streamerId, input.id);
  if (!created) throw new HttpError("Falha ao criar contador", 500);
  return created;
}

export async function updateCounter(
  streamerId: string,
  counterId: string,
  patch: Partial<CreateCounterInput> & { status?: string; sortOrder?: number }
): Promise<CounterDto> {
  const existing = await getCounterById(streamerId, counterId);
  if (!existing) throw new HttpError("Contador não encontrado", 404, "NOT_FOUND");

  const now = new Date();
  const updates: Partial<typeof counters.$inferInsert> = { updatedAt: now };

  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.slug !== undefined) updates.slug = patch.slug.trim();
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.type !== undefined) updates.type = patch.type;
  if (patch.minValue !== undefined) updates.minValue = patch.minValue;
  if (patch.maxValue !== undefined) updates.maxValue = patch.maxValue;
  if (patch.goalValue !== undefined) updates.goalValue = patch.goalValue;
  if (patch.color !== undefined) updates.color = patch.color;
  if (patch.icon !== undefined) updates.icon = patch.icon;
  if (patch.emoji !== undefined) updates.emoji = patch.emoji;
  if (patch.categoryId !== undefined) updates.categoryId = patch.categoryId;
  if (patch.tags !== undefined) updates.tags = JSON.stringify(patch.tags);
  if (patch.resetPolicy !== undefined) updates.resetPolicy = patch.resetPolicy;
  if (patch.overlayConfig !== undefined) {
    updates.overlayConfig = JSON.stringify(patch.overlayConfig);
  }
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.sortOrder !== undefined) updates.sortOrder = patch.sortOrder;

  await db
    .update(counters)
    .set(updates)
    .where(and(eq(counters.streamerId, streamerId), eq(counters.id, counterId)));

  await syncBotAfterCounterChange(streamerId);

  const updated = await getCounterById(streamerId, counterId);
  if (!updated) throw new HttpError("Falha ao atualizar contador", 500);
  return updated;
}

export async function archiveCounter(
  streamerId: string,
  counterId: string
): Promise<CounterDto> {
  return updateCounter(streamerId, counterId, { status: "archived" });
}

export async function deleteCounter(streamerId: string, counterId: string): Promise<void> {
  const existing = await getCounterById(streamerId, counterId);
  if (!existing) throw new HttpError("Contador não encontrado", 404, "NOT_FOUND");

  await db
    .update(counters)
    .set({ deletedAt: new Date(), status: "archived", updatedAt: new Date() })
    .where(and(eq(counters.streamerId, streamerId), eq(counters.id, counterId)));

  await syncBotAfterCounterChange(streamerId);
}

export async function duplicateCounter(
  streamerId: string,
  counterId: string,
  newId: string
): Promise<CounterDto> {
  const existing = await getCounterById(streamerId, counterId);
  if (!existing) throw new HttpError("Contador não encontrado", 404, "NOT_FOUND");

  let slug = `${existing.slug}-copia`;
  let suffix = 2;
  while (await getCounterBySlug(streamerId, slug)) {
    slug = `${existing.slug}-copia-${suffix}`;
    suffix += 1;
  }

  return createCounter({
    id: newId,
    streamerId,
    name: `${existing.name} (cópia)`,
    slug,
    description: existing.description,
    type: existing.type,
    value: 0,
    minValue: existing.minValue,
    maxValue: existing.maxValue,
    goalValue: existing.goalValue,
    color: existing.color,
    icon: existing.icon,
    emoji: existing.emoji,
    categoryId: existing.categoryId,
    tags: existing.tags,
    resetPolicy: existing.resetPolicy,
    overlayConfig: existing.overlayConfig,
  });
}

async function recordHistory(params: {
  streamerId: string;
  counter: CounterDto;
  previousValue: number;
  newValue: number;
  operation: CounterOperation;
  source: CounterChangeSource;
  actorUserId?: string | null;
  actorUsername?: string | null;
  actorDisplayName?: string | null;
}) {
  const delta = params.newValue - params.previousValue;
  await db.insert(counterHistory).values({
    id: createRandomString(),
    streamerId: params.streamerId,
    counterId: params.counter.id,
    counterSlug: params.counter.slug,
    counterName: params.counter.name,
    previousValue: params.previousValue,
    newValue: params.newValue,
    delta: operationIsRead(params.operation) ? null : delta,
    operation: params.operation,
    source: params.source,
    actorUserId: params.actorUserId ?? null,
    actorUsername: params.actorUsername ?? null,
    actorDisplayName: params.actorDisplayName ?? null,
    createdAt: new Date(),
  });
}

function operationIsRead(operation: CounterOperation): boolean {
  return false;
}

export async function adjustCounter(
  streamerId: string,
  counterId: string,
  operation: CounterOperation,
  options: {
    amount?: number;
    source?: CounterChangeSource;
    actorUserId?: string | null;
    actorUsername?: string | null;
    actorDisplayName?: string | null;
  } = {}
): Promise<CounterDto> {
  const config = await ensureCountersConfig(streamerId);
  if (!config.enabled) {
    throw new HttpError("Módulo de contadores desativado", 403, "COUNTERS_DISABLED");
  }

  const counter = await getCounterById(streamerId, counterId);
  if (!counter) throw new HttpError("Contador não encontrado", 404, "NOT_FOUND");
  if (counter.status === "archived") {
    throw new HttpError("Contador arquivado", 400, "COUNTER_ARCHIVED");
  }

  const previousValue = counter.value;
  const newValue = resolveNewValue(counter, operation, options.amount);
  const now = new Date();
  const actorLabel =
    options.actorUsername ?? options.actorDisplayName ?? options.actorUserId ?? null;

  const goalReached =
    counter.goalValue !== null &&
    previousValue < counter.goalValue &&
    newValue >= counter.goalValue;

  await db
    .update(counters)
    .set({
      value: newValue,
      useCount: sql`${counters.useCount} + 1`,
      lastChangedAt: now,
      lastChangedBy: actorLabel,
      goalReachedAt: goalReached ? now : counter.goalReachedAt,
      updatedAt: now,
    })
    .where(and(eq(counters.streamerId, streamerId), eq(counters.id, counterId)));

  await recordHistory({
    streamerId,
    counter,
    previousValue,
    newValue,
    operation,
    source: options.source ?? "panel",
    actorUserId: options.actorUserId,
    actorUsername: options.actorUsername,
    actorDisplayName: options.actorDisplayName,
  });

  await syncBotAfterCounterChange(streamerId);

  const updated = await getCounterById(streamerId, counterId);
  if (!updated) throw new HttpError("Falha ao ajustar contador", 500);
  return updated;
}

export async function adjustCounterFromBot(
  streamerId: string,
  input: BotAdjustCounterInput
): Promise<CounterDto> {
  const counter = await getCounterBySlug(streamerId, input.slug);
  if (!counter) {
    throw new HttpError("Contador não encontrado", 404, "COUNTER_NOT_FOUND");
  }

  return adjustCounter(streamerId, counter.id, input.operation, {
    amount: input.amount,
    source: input.source ?? "chat",
    actorUserId: input.twitchUserId ?? null,
    actorUsername: input.twitchUsername ?? null,
    actorDisplayName: input.displayName ?? null,
  });
}

export async function listCounterHistory(
  streamerId: string,
  options: { counterId?: string; limit?: number } = {}
): Promise<CounterHistoryEntryDto[]> {
  const limit = Math.min(options.limit ?? 50, 200);
  const conditions = [eq(counterHistory.streamerId, streamerId)];

  if (options.counterId) {
    conditions.push(eq(counterHistory.counterId, options.counterId));
  }

  const rows = await db
    .select()
    .from(counterHistory)
    .where(and(...conditions))
    .orderBy(desc(counterHistory.createdAt))
    .limit(limit);

  return rows.map(mapHistoryRow);
}

export async function getCountersDashboard(
  streamerId: string
): Promise<CountersDashboardDto> {
  const allCounters = await listCounters(streamerId, { status: "active" });
  const archived = await listCounters(streamerId, { status: "archived" });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayHistory = await db
    .select()
    .from(counterHistory)
    .where(
      and(
        eq(counterHistory.streamerId, streamerId),
        gte(counterHistory.createdAt, startOfDay)
      )
    );

  const goalsInProgress = allCounters.items.filter(
    (c) => c.goalValue !== null && c.value < c.goalValue
  ).length;

  const mostUsed = [...allCounters.items]
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      useCount: c.useCount,
    }));

  const recentlyChanged = [...allCounters.items]
    .filter((c) => c.lastChangedAt)
    .sort((a, b) => (b.lastChangedAt?.getTime() ?? 0) - (a.lastChangedAt?.getTime() ?? 0))
    .slice(0, 5)
    .map((c) => ({
      counterId: c.id,
      name: c.name,
      slug: c.slug,
      value: c.value,
      changedAt: c.lastChangedAt!,
      changedBy: c.lastChangedBy,
    }));

  const recentHistory = await listCounterHistory(streamerId, { limit: 10 });

  return {
    totalCounters: allCounters.total + archived.total,
    activeCounters: allCounters.total,
    goalsInProgress,
    totalAdjustmentsToday: todayHistory.length,
    mostUsed,
    recentlyChanged,
    recentHistory,
  };
}

export async function listCountersForBotSnapshot(
  streamerId: string
): Promise<CounterBotSnapshot[]> {
  const config = await ensureCountersConfig(streamerId);
  if (!config.enabled) return [];

  const result = await listCounters(streamerId, { status: "active" });
  return result.items.map((c) => ({
    id: c.id,
    name: c.slug,
    value: c.value,
    goalValue: c.goalValue,
    type: c.type,
  }));
}
