import {
  and,
  desc,
  eq,
  like,
  or,
  sql,
} from "drizzle-orm";
import { db } from "./db";
import {
  channelViewerEconomy,
  economyAuditLog,
  economyChannelConfig,
  economyLevelsConfig,
  economyPointsConfig,
  platformUserCoins,
} from "./schema";
import {
  DEFAULT_LEVELS_DEFINITION,
  type ChannelViewerEconomyDto,
  type EconomyAuditAction,
  type EconomyCurrencyType,
  type EconomyFullConfigDto,
  type EconomyGeneralConfigDto,
  type EconomyLevelsConfigDto,
  type EconomyOverviewDto,
  type EconomyPointsConfigDto,
  type EconomyRankingEntryDto,
  type EconomyLevelDefinition,
  type PlatformUserCoinsDto,
  type ViewerBalanceDto,
} from "@server/economy/economy.types";
import { defaultLevelsDefinitionJson } from "@server/economy/economy.validators";
import { HttpError } from "@server/utils/http-error";

function parseLevelsDefinition(raw: string): EconomyLevelDefinition[] {
  try {
    const parsed = JSON.parse(raw) as EconomyLevelDefinition[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_LEVELS_DEFINITION;
    }
    return parsed;
  } catch {
    return DEFAULT_LEVELS_DEFINITION;
  }
}

function resolveLevelFromXp(
  xp: number,
  levels: EconomyLevelDefinition[]
): { level: number; title?: string } {
  const sorted = [...levels].sort((a, b) => b.xpRequired - a.xpRequired);
  for (const entry of sorted) {
    if (xp >= entry.xpRequired) {
      return { level: entry.level, title: entry.title };
    }
  }
  return { level: 1, title: levels[0]?.title };
}

function todayUtcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function bumpEconomyConfigVersion(streamerId: string): Promise<number> {
  const now = new Date();
  const existing = await db
    .select()
    .from(economyChannelConfig)
    .where(eq(economyChannelConfig.streamerId, streamerId))
    .limit(1);

  if (existing[0]) {
    const nextVersion = existing[0].configVersion + 1;
    await db
      .update(economyChannelConfig)
      .set({ configVersion: nextVersion, updatedAt: now })
      .where(eq(economyChannelConfig.streamerId, streamerId));
    return nextVersion;
  }

  await db.insert(economyChannelConfig).values({
    streamerId,
    enabled: false,
    pointsEnabled: false,
    levelsEnabled: false,
    publicRankingEnabled: true,
    configVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  return 1;
}

export async function ensureEconomyDefaults(streamerId: string): Promise<void> {
  const now = new Date();
  const [general] = await db
    .select()
    .from(economyChannelConfig)
    .where(eq(economyChannelConfig.streamerId, streamerId))
    .limit(1);

  if (!general) {
    await db.insert(economyChannelConfig).values({
      streamerId,
      enabled: false,
      pointsEnabled: false,
      levelsEnabled: false,
      publicRankingEnabled: true,
      configVersion: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [points] = await db
    .select()
    .from(economyPointsConfig)
    .where(eq(economyPointsConfig.streamerId, streamerId))
    .limit(1);

  if (!points) {
    await db.insert(economyPointsConfig).values({
      streamerId,
      pointsPerInterval: 10,
      intervalMinutes: 5,
      minMessagesPerInterval: 1,
      subscriberMultiplier: 2,
      vipMultiplier: 1.5,
      moderatorMultiplier: 1,
      dailyPointsCap: null,
      earnMessageEnabled: false,
      earnMessageTemplate: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [levels] = await db
    .select()
    .from(economyLevelsConfig)
    .where(eq(economyLevelsConfig.streamerId, streamerId))
    .limit(1);

  if (!levels) {
    await db.insert(economyLevelsConfig).values({
      streamerId,
      xpFormula: "linear",
      xpPerMessage: 5,
      xpPerMinuteWatching: 1,
      levelsDefinition: defaultLevelsDefinitionJson,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function mapGeneralRow(
  row: typeof economyChannelConfig.$inferSelect
): EconomyGeneralConfigDto {
  return {
    enabled: Boolean(row.enabled),
    pointsEnabled: Boolean(row.pointsEnabled),
    levelsEnabled: Boolean(row.levelsEnabled),
    publicRankingEnabled: Boolean(row.publicRankingEnabled),
    configVersion: row.configVersion,
    updatedAt: row.updatedAt,
  };
}

function mapPointsRow(
  row: typeof economyPointsConfig.$inferSelect
): EconomyPointsConfigDto {
  return {
    pointsPerInterval: row.pointsPerInterval,
    intervalMinutes: row.intervalMinutes,
    minMessagesPerInterval: row.minMessagesPerInterval,
    subscriberMultiplier: row.subscriberMultiplier,
    vipMultiplier: row.vipMultiplier,
    moderatorMultiplier: row.moderatorMultiplier,
    dailyPointsCap: row.dailyPointsCap ?? null,
    earnMessageEnabled: Boolean(row.earnMessageEnabled),
    earnMessageTemplate: row.earnMessageTemplate ?? null,
    updatedAt: row.updatedAt,
  };
}

function mapLevelsRow(
  row: typeof economyLevelsConfig.$inferSelect
): EconomyLevelsConfigDto {
  return {
    xpFormula: row.xpFormula as EconomyLevelsConfigDto["xpFormula"],
    xpPerMessage: row.xpPerMessage,
    xpPerMinuteWatching: row.xpPerMinuteWatching,
    levelsDefinition: parseLevelsDefinition(row.levelsDefinition),
    updatedAt: row.updatedAt,
  };
}

function mapViewerRow(
  row: typeof channelViewerEconomy.$inferSelect,
  levelTitle?: string
): ChannelViewerEconomyDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    twitchUserId: row.twitchUserId,
    twitchUsername: row.twitchUsername,
    displayName: row.displayName,
    points: row.points,
    xp: row.xp,
    level: row.level,
    levelTitle,
    lastActivityAt: row.lastActivityAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getEconomyFullConfig(
  streamerId: string
): Promise<EconomyFullConfigDto> {
  await ensureEconomyDefaults(streamerId);

  const [generalRow] = await db
    .select()
    .from(economyChannelConfig)
    .where(eq(economyChannelConfig.streamerId, streamerId))
    .limit(1);
  const [pointsRow] = await db
    .select()
    .from(economyPointsConfig)
    .where(eq(economyPointsConfig.streamerId, streamerId))
    .limit(1);
  const [levelsRow] = await db
    .select()
    .from(economyLevelsConfig)
    .where(eq(economyLevelsConfig.streamerId, streamerId))
    .limit(1);

  return {
    general: mapGeneralRow(generalRow!),
    points: mapPointsRow(pointsRow!),
    levels: mapLevelsRow(levelsRow!),
  };
}

export async function getEconomyOverview(
  streamerId: string
): Promise<EconomyOverviewDto> {
  await ensureEconomyDefaults(streamerId);
  const config = await getEconomyFullConfig(streamerId);

  const viewerRows = await db
    .select()
    .from(channelViewerEconomy)
    .where(eq(channelViewerEconomy.streamerId, streamerId));

  return {
    enabled: config.general.enabled,
    pointsEnabled: config.general.pointsEnabled,
    levelsEnabled: config.general.levelsEnabled,
    totalUsers: viewerRows.length,
    totalPointsDistributed: viewerRows.reduce((sum, row) => sum + row.points, 0),
    activeLevelsCount: config.levels.levelsDefinition.length,
    configVersion: config.general.configVersion,
  };
}

export async function updateEconomyGeneralConfig(
  streamerId: string,
  patch: Partial<{
    enabled: boolean;
    pointsEnabled: boolean;
    levelsEnabled: boolean;
    publicRankingEnabled: boolean;
  }>
): Promise<{ config: EconomyGeneralConfigDto; configVersion: number }> {
  await ensureEconomyDefaults(streamerId);
  const now = new Date();

  await db
    .update(economyChannelConfig)
    .set({ ...patch, updatedAt: now })
    .where(eq(economyChannelConfig.streamerId, streamerId));

  const configVersion = await bumpEconomyConfigVersion(streamerId);
  const [row] = await db
    .select()
    .from(economyChannelConfig)
    .where(eq(economyChannelConfig.streamerId, streamerId))
    .limit(1);

  return { config: mapGeneralRow(row!), configVersion };
}

export async function updateEconomyPointsConfig(
  streamerId: string,
  patch: Partial<{
    pointsPerInterval: number;
    intervalMinutes: number;
    minMessagesPerInterval: number;
    subscriberMultiplier: number;
    vipMultiplier: number;
    moderatorMultiplier: number;
    dailyPointsCap: number | null;
    earnMessageEnabled: boolean;
    earnMessageTemplate: string | null;
  }>
): Promise<{ config: EconomyPointsConfigDto; configVersion: number }> {
  await ensureEconomyDefaults(streamerId);
  const now = new Date();

  await db
    .update(economyPointsConfig)
    .set({ ...patch, updatedAt: now })
    .where(eq(economyPointsConfig.streamerId, streamerId));

  const configVersion = await bumpEconomyConfigVersion(streamerId);
  const [row] = await db
    .select()
    .from(economyPointsConfig)
    .where(eq(economyPointsConfig.streamerId, streamerId))
    .limit(1);

  return { config: mapPointsRow(row!), configVersion };
}

export async function updateEconomyLevelsConfig(
  streamerId: string,
  patch: Partial<{
    xpFormula: string;
    xpPerMessage: number;
    xpPerMinuteWatching: number;
    levelsDefinition: EconomyLevelDefinition[];
  }>
): Promise<{ config: EconomyLevelsConfigDto; configVersion: number }> {
  await ensureEconomyDefaults(streamerId);
  const now = new Date();
  const dbPatch: Record<string, unknown> = { ...patch, updatedAt: now };

  if (patch.levelsDefinition) {
    dbPatch.levelsDefinition = JSON.stringify(patch.levelsDefinition);
  }

  await db
    .update(economyLevelsConfig)
    .set(dbPatch)
    .where(eq(economyLevelsConfig.streamerId, streamerId));

  const configVersion = await bumpEconomyConfigVersion(streamerId);
  const [row] = await db
    .select()
    .from(economyLevelsConfig)
    .where(eq(economyLevelsConfig.streamerId, streamerId))
    .limit(1);

  return { config: mapLevelsRow(row!), configVersion };
}

async function getLevelsForStreamer(
  streamerId: string
): Promise<EconomyLevelDefinition[]> {
  const [row] = await db
    .select()
    .from(economyLevelsConfig)
    .where(eq(economyLevelsConfig.streamerId, streamerId))
    .limit(1);
  return row ? parseLevelsDefinition(row.levelsDefinition) : DEFAULT_LEVELS_DEFINITION;
}

export async function listChannelViewers(
  streamerId: string,
  options: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "points" | "level" | "activity";
  } = {}
): Promise<{ items: ChannelViewerEconomyDto[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const offset = (page - 1) * limit;
  const levels = await getLevelsForStreamer(streamerId);

  const conditions = [eq(channelViewerEconomy.streamerId, streamerId)];

  if (options.search?.trim()) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`LOWER(${channelViewerEconomy.twitchUsername})`, term),
        like(sql`LOWER(${channelViewerEconomy.displayName})`, term)
      )!
    );
  }

  const whereClause = and(...conditions);

  const totalRows = await db
    .select()
    .from(channelViewerEconomy)
    .where(whereClause);

  const sortBy = options.sortBy ?? "points";
  const orderColumn =
    sortBy === "activity"
      ? channelViewerEconomy.lastActivityAt
      : sortBy === "level"
        ? channelViewerEconomy.level
        : channelViewerEconomy.points;

  const rows = await db
    .select()
    .from(channelViewerEconomy)
    .where(whereClause)
    .orderBy(desc(orderColumn))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((row) => {
      const { title } = resolveLevelFromXp(row.xp, levels);
      return mapViewerRow(row, title);
    }),
    total: totalRows.length,
    page,
    limit,
  };
}

export async function getChannelRanking(
  streamerId: string,
  options: { search?: string; page?: number; limit?: number } = {}
): Promise<{ items: EconomyRankingEntryDto[]; total: number; page: number; limit: number }> {
  const result = await listChannelViewers(streamerId, {
    ...options,
    sortBy: "points",
  });

  const items: EconomyRankingEntryDto[] = result.items.map((viewer, index) => ({
    position: (result.page - 1) * result.limit + index + 1,
    twitchUserId: viewer.twitchUserId,
    twitchUsername: viewer.twitchUsername,
    displayName: viewer.displayName,
    points: viewer.points,
    level: viewer.level,
    levelTitle: viewer.levelTitle,
    lastActivityAt: viewer.lastActivityAt,
  }));

  return { items, total: result.total, page: result.page, limit: result.limit };
}

export async function getViewerBalance(
  streamerId: string,
  twitchUserId: string
): Promise<ViewerBalanceDto> {
  const levels = await getLevelsForStreamer(streamerId);

  const [viewer] = await db
    .select()
    .from(channelViewerEconomy)
    .where(
      and(
        eq(channelViewerEconomy.streamerId, streamerId),
        eq(channelViewerEconomy.twitchUserId, twitchUserId)
      )
    )
    .limit(1);

  const [coins] = await db
    .select()
    .from(platformUserCoins)
    .where(eq(platformUserCoins.twitchUserId, twitchUserId))
    .limit(1);

  const channel = viewer
    ? mapViewerRow(
        viewer,
        resolveLevelFromXp(viewer.xp, levels).title
      )
    : null;

  return {
    channel,
    coins: coins
      ? {
          twitchUserId: coins.twitchUserId,
          twitchUsername: coins.twitchUsername,
          displayName: coins.displayName,
          coins: coins.coins,
          updatedAt: coins.updatedAt,
        }
      : null,
  };
}

async function recordAuditLog(input: {
  id: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  targetTwitchUserId: string;
  targetTwitchUsername: string;
  action: EconomyAuditAction;
  currencyType: EconomyCurrencyType;
  previousValue: number;
  newValue: number;
  reason: string;
}): Promise<void> {
  await db.insert(economyAuditLog).values({
    id: input.id,
    streamerId: input.streamerId,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    targetTwitchUserId: input.targetTwitchUserId,
    targetTwitchUsername: input.targetTwitchUsername,
    action: input.action,
    currencyType: input.currencyType,
    previousValue: input.previousValue,
    newValue: input.newValue,
    delta: input.newValue - input.previousValue,
    reason: input.reason,
    createdAt: new Date(),
  });
}

export async function addChannelViewerManual(input: {
  id: string;
  streamerId: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
}): Promise<ChannelViewerEconomyDto> {
  await ensureEconomyDefaults(input.streamerId);

  const [existing] = await db
    .select()
    .from(channelViewerEconomy)
    .where(
      and(
        eq(channelViewerEconomy.streamerId, input.streamerId),
        eq(channelViewerEconomy.twitchUserId, input.twitchUserId)
      )
    )
    .limit(1);

  if (existing) {
    throw new HttpError(
      "Este viewer já está cadastrado no canal.",
      409,
      "CONFLICT"
    );
  }

  return upsertChannelViewer(input);
}

export async function upsertChannelViewer(input: {
  id: string;
  streamerId: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
}): Promise<ChannelViewerEconomyDto> {
  await ensureEconomyDefaults(input.streamerId);
  const now = new Date();
  const levels = await getLevelsForStreamer(input.streamerId);

  const [existing] = await db
    .select()
    .from(channelViewerEconomy)
    .where(
      and(
        eq(channelViewerEconomy.streamerId, input.streamerId),
        eq(channelViewerEconomy.twitchUserId, input.twitchUserId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(channelViewerEconomy)
      .set({
        twitchUsername: input.twitchUsername.toLowerCase(),
        displayName: input.displayName,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(channelViewerEconomy.id, existing.id));

    const [updated] = await db
      .select()
      .from(channelViewerEconomy)
      .where(eq(channelViewerEconomy.id, existing.id))
      .limit(1);

    return mapViewerRow(
      updated!,
      resolveLevelFromXp(updated!.xp, levels).title
    );
  }

  await db.insert(channelViewerEconomy).values({
    id: input.id,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername.toLowerCase(),
    displayName: input.displayName,
    points: 0,
    xp: 0,
    level: 1,
    dailyPointsEarned: 0,
    dailyPointsDate: null,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(channelViewerEconomy)
    .where(eq(channelViewerEconomy.id, input.id))
    .limit(1);

  return mapViewerRow(created!, levels[0]?.title);
}

async function getViewerRowById(id: string) {
  const [row] = await db
    .select()
    .from(channelViewerEconomy)
    .where(eq(channelViewerEconomy.id, id))
    .limit(1);
  return row ?? null;
}

export async function botAwardPoints(input: {
  streamerId: string;
  viewerId: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  basePoints: number;
  multiplier?: number;
}): Promise<{ awarded: number; viewer: ChannelViewerEconomyDto; capped: boolean }> {
  await ensureEconomyDefaults(input.streamerId);
  const config = await getEconomyFullConfig(input.streamerId);

  if (!config.general.enabled || !config.general.pointsEnabled) {
    return {
      awarded: 0,
      viewer: await upsertChannelViewer({
        id: input.viewerId,
        streamerId: input.streamerId,
        twitchUserId: input.twitchUserId,
        twitchUsername: input.twitchUsername,
        displayName: input.displayName,
      }),
      capped: false,
    };
  }

  const multiplier = input.multiplier ?? 1;
  let pointsToAward = Math.floor(input.basePoints * multiplier);
  if (pointsToAward <= 0) {
    const viewer = await upsertChannelViewer({
      id: input.viewerId,
      streamerId: input.streamerId,
      twitchUserId: input.twitchUserId,
      twitchUsername: input.twitchUsername,
      displayName: input.displayName,
    });
    return { awarded: 0, viewer, capped: false };
  }

  const viewer = await upsertChannelViewer({
    id: input.viewerId,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername,
    displayName: input.displayName,
  });

  const row = await getViewerRowById(viewer.id);
  if (!row) {
    return { awarded: 0, viewer, capped: false };
  }

  const now = new Date();
  const today = todayUtcDateKey();
  let dailyEarned = row.dailyPointsDate === today ? row.dailyPointsEarned : 0;

  let capped = false;
  const cap = config.points.dailyPointsCap;
  if (cap != null) {
    const remaining = cap - dailyEarned;
    if (remaining <= 0) {
      return { awarded: 0, viewer, capped: true };
    }
    if (pointsToAward > remaining) {
      pointsToAward = remaining;
      capped = true;
    }
  }

  const newPoints = row.points + pointsToAward;
  dailyEarned += pointsToAward;

  await db
    .update(channelViewerEconomy)
    .set({
      points: newPoints,
      dailyPointsEarned: dailyEarned,
      dailyPointsDate: today,
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(channelViewerEconomy.id, viewer.id));

  const levels = await getLevelsForStreamer(input.streamerId);
  const updatedRow = await getViewerRowById(viewer.id);

  return {
    awarded: pointsToAward,
    viewer: mapViewerRow(updatedRow!, resolveLevelFromXp(updatedRow!.xp, levels).title),
    capped,
  };
}

export async function botAwardXp(input: {
  streamerId: string;
  viewerId: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  xpAmount: number;
}): Promise<{ awarded: number; viewer: ChannelViewerEconomyDto }> {
  await ensureEconomyDefaults(input.streamerId);
  const config = await getEconomyFullConfig(input.streamerId);

  if (!config.general.enabled || !config.general.levelsEnabled || input.xpAmount <= 0) {
    return {
      awarded: 0,
      viewer: await upsertChannelViewer({
        id: input.viewerId,
        streamerId: input.streamerId,
        twitchUserId: input.twitchUserId,
        twitchUsername: input.twitchUsername,
        displayName: input.displayName,
      }),
    };
  }

  const viewer = await upsertChannelViewer({
    id: input.viewerId,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername,
    displayName: input.displayName,
  });

  const levels = config.levels.levelsDefinition;
  const newXp = viewer.xp + input.xpAmount;
  const { level, title } = resolveLevelFromXp(newXp, levels);
  const now = new Date();

  await db
    .update(channelViewerEconomy)
    .set({
      xp: newXp,
      level,
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(channelViewerEconomy.id, viewer.id));

  const updatedRow = await getViewerRowById(viewer.id);

  return {
    awarded: input.xpAmount,
    viewer: mapViewerRow(updatedRow!, title),
  };
}

export async function adjustViewerPoints(input: {
  auditId: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  viewerId: string;
  delta: number;
  reason: string;
}): Promise<ChannelViewerEconomyDto> {
  await ensureEconomyDefaults(input.streamerId);
  const levels = await getLevelsForStreamer(input.streamerId);
  const viewer = await upsertChannelViewer({
    id: input.viewerId,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername,
    displayName: input.displayName,
  });

  const previous = viewer.points;
  const newValue = Math.max(0, previous + input.delta);
  const now = new Date();

  await db
    .update(channelViewerEconomy)
    .set({ points: newValue, updatedAt: now })
    .where(eq(channelViewerEconomy.id, viewer.id));

  await recordAuditLog({
    id: input.auditId,
    streamerId: input.streamerId,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    targetTwitchUserId: input.twitchUserId,
    targetTwitchUsername: input.twitchUsername,
    action: input.delta >= 0 ? "add_points" : "remove_points",
    currencyType: "points",
    previousValue: previous,
    newValue,
    reason: input.reason,
  });

  const updatedRow = await getViewerRowById(viewer.id);

  return mapViewerRow(
    updatedRow!,
    resolveLevelFromXp(updatedRow!.xp, levels).title
  );
}

export async function setViewerPoints(input: {
  auditId: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  viewerId: string;
  points: number;
  reason: string;
}): Promise<ChannelViewerEconomyDto> {
  await ensureEconomyDefaults(input.streamerId);
  const levels = await getLevelsForStreamer(input.streamerId);
  const viewer = await upsertChannelViewer({
    id: input.viewerId,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername,
    displayName: input.displayName,
  });

  const previous = viewer.points;
  const newValue = Math.max(0, input.points);
  const now = new Date();

  await db
    .update(channelViewerEconomy)
    .set({ points: newValue, updatedAt: now })
    .where(eq(channelViewerEconomy.id, viewer.id));

  if (previous !== newValue) {
    await recordAuditLog({
      id: input.auditId,
      streamerId: input.streamerId,
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      targetTwitchUserId: input.twitchUserId,
      targetTwitchUsername: input.twitchUsername,
      action: "set_points",
      currencyType: "points",
      previousValue: previous,
      newValue,
      reason: input.reason,
    });
  }

  const updatedRow = await getViewerRowById(viewer.id);

  return mapViewerRow(
    updatedRow!,
    resolveLevelFromXp(updatedRow!.xp, levels).title
  );
}

export async function adjustUserCoins(input: {
  auditId: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  delta: number;
  reason: string;
}): Promise<PlatformUserCoinsDto> {
  const now = new Date();

  const [existing] = await db
    .select()
    .from(platformUserCoins)
    .where(eq(platformUserCoins.twitchUserId, input.twitchUserId))
    .limit(1);

  const previous = existing?.coins ?? 0;
  const newValue = Math.max(0, previous + input.delta);

  if (existing) {
    await db
      .update(platformUserCoins)
      .set({
        twitchUsername: input.twitchUsername.toLowerCase(),
        displayName: input.displayName,
        coins: newValue,
        updatedAt: now,
      })
      .where(eq(platformUserCoins.twitchUserId, input.twitchUserId));
  } else {
    await db.insert(platformUserCoins).values({
      twitchUserId: input.twitchUserId,
      twitchUsername: input.twitchUsername.toLowerCase(),
      displayName: input.displayName,
      coins: newValue,
      createdAt: now,
      updatedAt: now,
    });
  }

  await recordAuditLog({
    id: input.auditId,
    streamerId: input.streamerId,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    targetTwitchUserId: input.twitchUserId,
    targetTwitchUsername: input.twitchUsername,
    action: input.delta >= 0 ? "add_coins" : "remove_coins",
    currencyType: "coins",
    previousValue: previous,
    newValue,
    reason: input.reason,
  });

  return {
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername.toLowerCase(),
    displayName: input.displayName,
    coins: newValue,
    updatedAt: now,
  };
}

export async function resetViewerEconomy(input: {
  auditId: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  viewerId: string;
  resetPoints: boolean;
  resetXp: boolean;
  reason: string;
}): Promise<ChannelViewerEconomyDto> {
  await ensureEconomyDefaults(input.streamerId);
  const levels = await getLevelsForStreamer(input.streamerId);
  const viewer = await upsertChannelViewer({
    id: input.viewerId,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername,
    displayName: input.displayName,
  });

  const now = new Date();
  let newPoints = viewer.points;
  let newXp = viewer.xp;
  let newLevel = viewer.level;

  if (input.resetPoints && viewer.points > 0) {
    await recordAuditLog({
      id: `${input.auditId}-points`,
      streamerId: input.streamerId,
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      targetTwitchUserId: input.twitchUserId,
      targetTwitchUsername: input.twitchUsername,
      action: "reset_points",
      currencyType: "points",
      previousValue: viewer.points,
      newValue: 0,
      reason: input.reason,
    });
    newPoints = 0;
  }

  if (input.resetXp && viewer.xp > 0) {
    await recordAuditLog({
      id: `${input.auditId}-xp`,
      streamerId: input.streamerId,
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      targetTwitchUserId: input.twitchUserId,
      targetTwitchUsername: input.twitchUsername,
      action: "reset_xp",
      currencyType: "xp",
      previousValue: viewer.xp,
      newValue: 0,
      reason: input.reason,
    });
    newXp = 0;
    newLevel = 1;
  }

  await db
    .update(channelViewerEconomy)
    .set({
      points: newPoints,
      xp: newXp,
      level: newLevel,
      ...(input.resetPoints
        ? { dailyPointsEarned: 0, dailyPointsDate: null }
        : {}),
      updatedAt: now,
    })
    .where(eq(channelViewerEconomy.id, viewer.id));

  const updatedRow = await getViewerRowById(viewer.id);

  return mapViewerRow(
    updatedRow!,
    resolveLevelFromXp(newXp, levels).title
  );
}

export async function resetAllChannelPoints(input: {
  auditId: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  reason: string;
}): Promise<{ affected: number }> {
  const viewers = await db
    .select()
    .from(channelViewerEconomy)
    .where(eq(channelViewerEconomy.streamerId, input.streamerId));

  const now = new Date();
  let affected = 0;

  for (const viewer of viewers) {
    if (viewer.points <= 0) continue;
    affected += 1;
    await recordAuditLog({
      id: `${input.auditId}-${viewer.twitchUserId}`,
      streamerId: input.streamerId,
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      targetTwitchUserId: viewer.twitchUserId,
      targetTwitchUsername: viewer.twitchUsername,
      action: "reset_all_channel_points",
      currencyType: "points",
      previousValue: viewer.points,
      newValue: 0,
      reason: input.reason,
    });
  }

  await db
    .update(channelViewerEconomy)
    .set({
      points: 0,
      dailyPointsEarned: 0,
      dailyPointsDate: null,
      updatedAt: now,
    })
    .where(eq(channelViewerEconomy.streamerId, input.streamerId));

  return { affected };
}

export async function getEconomyConfigSnapshot(streamerId: string) {
  await ensureEconomyDefaults(streamerId);
  return getEconomyFullConfig(streamerId);
}

export async function getEconomyConfigVersion(
  streamerId: string
): Promise<number> {
  await ensureEconomyDefaults(streamerId);
  const rows = await db
    .select()
    .from(economyChannelConfig)
    .where(eq(economyChannelConfig.streamerId, streamerId))
    .limit(1);
  return rows[0]?.configVersion ?? 1;
}
