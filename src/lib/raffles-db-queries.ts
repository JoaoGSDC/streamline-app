import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  raffleChatMessages,
  raffleEntries,
  raffleWinners,
  raffles,
} from "./schema";
import type {
  BotActiveRaffleSnapshot,
  RaffleChatMessageRow,
  RaffleConfig,
  RaffleEntryRow,
  RaffleMode,
  RaffleRow,
  RaffleStatus,
  RaffleWinnerRow,
} from "@/types/raffle";
import type { z } from "zod";
import type { raffleCreateSchema } from "@server/raffles/raffles.validators";
import { getStreamerById, getStreamerByTwitchId } from "./db-queries";
import { HttpError } from "@server/utils/http-error";
import { publishRaffleEvent } from "@server/raffles/raffle-events";

type RaffleCreateInput = z.infer<typeof raffleCreateSchema>;

function parseJsonNumberArray(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapRaffle(row: typeof raffles.$inferSelect): RaffleRow {
  return {
    id: row.id,
    channelId: row.channelId,
    streamerId: row.streamerId,
    mode: row.mode as RaffleMode,
    keyword: row.keyword,
    title: row.title,
    prizeDescription: row.prizeDescription,
    winnerCount: row.winnerCount,
    maxEntriesPerUser: row.maxEntriesPerUser,
    durationSeconds: row.durationSeconds,
    pointsCost: row.pointsCost,
    requireFollower: row.requireFollower,
    minFollowDays: row.minFollowDays,
    requireSub: row.requireSub,
    allowedSubTiers: parseJsonStringArray(row.allowedSubTiers),
    requireVip: row.requireVip,
    excludeMods: row.excludeMods,
    excludeVips: row.excludeVips,
    requireWinnerConfirmation: row.requireWinnerConfirmation,
    confirmationTimeoutSeconds: row.confirmationTimeoutSeconds,
    confirmationKeyword: row.confirmationKeyword,
    announceStart: row.announceStart,
    announceReminders: parseJsonNumberArray(row.announceReminders),
    announceWinner: row.announceWinner,
    status: row.status as RaffleStatus,
    startedAt: row.startedAt,
    closedAt: row.closedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEntry(row: typeof raffleEntries.$inferSelect): RaffleEntryRow {
  return {
    id: row.id,
    raffleId: row.raffleId,
    twitchUserId: row.twitchUserId,
    twitchLogin: row.twitchLogin,
    displayName: row.displayName,
    entryCount: row.entryCount,
    source: row.source as RaffleEntryRow["source"],
    enteredAt: row.enteredAt,
  };
}

function mapMessage(row: typeof raffleChatMessages.$inferSelect): RaffleChatMessageRow {
  return {
    id: row.id,
    raffleId: row.raffleId,
    twitchUserId: row.twitchUserId,
    twitchLogin: row.twitchLogin,
    displayName: row.displayName,
    message: row.message,
    messageType: row.messageType as RaffleChatMessageRow["messageType"],
    sentAt: row.sentAt,
  };
}

function eligibilityLabel(raffle: RaffleRow): string {
  switch (raffle.mode) {
    case "keyword":
      return "Palavra-chave";
    case "points":
      return `${raffle.pointsCost} pontos`;
    case "manual":
      return "Manual";
    case "sub_only":
      return "Inscritos";
    case "vip_only":
      return "VIPs";
    case "follower_only":
      return "Seguidores";
    default:
      return raffle.mode;
  }
}

async function countEntries(raffleId: string) {
  const rows = await db
    .select()
    .from(raffleEntries)
    .where(eq(raffleEntries.raffleId, raffleId));
  return {
    entriesCount: rows.reduce((sum, row) => sum + row.entryCount, 0),
    uniqueUserCount: rows.length,
  };
}

export async function createRaffle(
  streamerId: string,
  input: RaffleCreateInput
): Promise<RaffleConfig> {
  const streamer = await getStreamerById(streamerId);
  if (!streamer) throw new HttpError("Streamer não encontrado", 404);

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(raffles).values({
    id,
    channelId: streamer.twitchId,
    streamerId,
    mode: input.mode,
    keyword: input.keyword ?? null,
    title: input.title ?? null,
    prizeDescription: input.prizeDescription ?? null,
    winnerCount: input.winnerCount,
    maxEntriesPerUser: input.maxEntriesPerUser,
    durationSeconds: input.durationSeconds,
    pointsCost: input.pointsCost,
    requireFollower: input.requireFollower,
    minFollowDays: input.minFollowDays,
    requireSub: input.requireSub,
    allowedSubTiers: JSON.stringify(input.allowedSubTiers),
    requireVip: input.requireVip,
    excludeMods: input.excludeMods,
    excludeVips: input.excludeVips,
    requireWinnerConfirmation: input.requireWinnerConfirmation,
    confirmationTimeoutSeconds: input.confirmationTimeoutSeconds,
    confirmationKeyword: input.confirmationKeyword,
    announceStart: input.announceStart,
    announceReminders: JSON.stringify(input.announceReminders),
    announceWinner: input.announceWinner,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  return getRaffleWithStats(id, streamerId);
}

export async function getRaffleById(raffleId: string, streamerId?: string) {
  const [row] = await db.select().from(raffles).where(eq(raffles.id, raffleId)).limit(1);
  if (!row) return null;
  if (streamerId && row.streamerId !== streamerId) return null;
  return mapRaffle(row);
}

export async function getRaffleWithStats(
  raffleId: string,
  streamerId?: string
): Promise<RaffleConfig> {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);

  const [entries, winners, recentMessages, counts] = await Promise.all([
    db
      .select()
      .from(raffleEntries)
      .where(eq(raffleEntries.raffleId, raffleId))
      .orderBy(desc(raffleEntries.enteredAt)),
    listWinnersWithEntries(raffleId),
    listRecentMessages(raffleId, 100),
    countEntries(raffleId),
  ]);

  const winnerUserIds = winners
    .filter((w) => w.status !== "rerolled")
    .map((w) => w.twitchUserId!)
    .filter(Boolean);

  const winnerMessages: Record<string, RaffleChatMessageRow[]> = {};
  for (const userId of winnerUserIds) {
    winnerMessages[userId] = recentMessages.filter((m) => m.twitchUserId === userId);
  }

  return {
    ...raffle,
    ...counts,
    entries: entries.map(mapEntry),
    winners,
    recentMessages,
    winnerMessages,
    eligibilityLabel: eligibilityLabel(raffle),
  };
}

async function listWinnersWithEntries(raffleId: string): Promise<RaffleWinnerRow[]> {
  const rows = await db
    .select()
    .from(raffleWinners)
    .innerJoin(raffleEntries, eq(raffleWinners.entryId, raffleEntries.id))
    .where(eq(raffleWinners.raffleId, raffleId))
    .orderBy(raffleWinners.position);

  return rows.map((row) => ({
    id: row.raffle_winners.id,
    raffleId: row.raffle_winners.raffleId,
    entryId: row.raffle_winners.entryId,
    position: row.raffle_winners.position,
    drawnAt: row.raffle_winners.drawnAt,
    confirmedAt: row.raffle_winners.confirmedAt,
    rerolledAt: row.raffle_winners.rerolledAt,
    rerollReason: row.raffle_winners.rerollReason,
    status: row.raffle_winners.status as RaffleWinnerRow["status"],
    twitchUserId: row.raffle_entries.twitchUserId,
    twitchLogin: row.raffle_entries.twitchLogin,
    displayName: row.raffle_entries.displayName,
  }));
}

export async function listRecentMessages(raffleId: string, limit = 100) {
  const rows = await db
    .select()
    .from(raffleChatMessages)
    .where(eq(raffleChatMessages.raffleId, raffleId))
    .orderBy(desc(raffleChatMessages.sentAt))
    .limit(limit);
  return rows.map(mapMessage).reverse();
}

export async function listMessagesSince(raffleId: string, sinceId: number) {
  const rows = await db
    .select()
    .from(raffleChatMessages)
    .where(
      and(eq(raffleChatMessages.raffleId, raffleId), gt(raffleChatMessages.id, sinceId))
    )
    .orderBy(raffleChatMessages.sentAt);
  return rows.map(mapMessage);
}

export async function updateRaffleConfig(
  raffleId: string,
  streamerId: string,
  input: Partial<RaffleCreateInput>
) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);
  if (!["draft", "paused"].includes(raffle.status)) {
    throw new HttpError("Só é possível editar sorteios em rascunho ou pausados", 400);
  }

  const patch: Partial<typeof raffles.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.mode !== undefined) patch.mode = input.mode;
  if (input.keyword !== undefined) patch.keyword = input.keyword ?? null;
  if (input.title !== undefined) patch.title = input.title ?? null;
  if (input.prizeDescription !== undefined) patch.prizeDescription = input.prizeDescription ?? null;
  if (input.winnerCount !== undefined) patch.winnerCount = input.winnerCount;
  if (input.maxEntriesPerUser !== undefined) patch.maxEntriesPerUser = input.maxEntriesPerUser;
  if (input.durationSeconds !== undefined) patch.durationSeconds = input.durationSeconds;
  if (input.pointsCost !== undefined) patch.pointsCost = input.pointsCost;
  if (input.requireFollower !== undefined) patch.requireFollower = input.requireFollower;
  if (input.minFollowDays !== undefined) patch.minFollowDays = input.minFollowDays;
  if (input.requireSub !== undefined) patch.requireSub = input.requireSub;
  if (input.allowedSubTiers !== undefined)
    patch.allowedSubTiers = JSON.stringify(input.allowedSubTiers);
  if (input.requireVip !== undefined) patch.requireVip = input.requireVip;
  if (input.excludeMods !== undefined) patch.excludeMods = input.excludeMods;
  if (input.excludeVips !== undefined) patch.excludeVips = input.excludeVips;
  if (input.requireWinnerConfirmation !== undefined)
    patch.requireWinnerConfirmation = input.requireWinnerConfirmation;
  if (input.confirmationTimeoutSeconds !== undefined)
    patch.confirmationTimeoutSeconds = input.confirmationTimeoutSeconds;
  if (input.confirmationKeyword !== undefined)
    patch.confirmationKeyword = input.confirmationKeyword;
  if (input.announceStart !== undefined) patch.announceStart = input.announceStart;
  if (input.announceReminders !== undefined)
    patch.announceReminders = JSON.stringify(input.announceReminders);
  if (input.announceWinner !== undefined) patch.announceWinner = input.announceWinner;

  await db.update(raffles).set(patch).where(eq(raffles.id, raffleId));
  return getRaffleWithStats(raffleId, streamerId);
}

async function setRaffleStatus(
  raffleId: string,
  streamerId: string,
  status: RaffleStatus,
  extra?: Partial<typeof raffles.$inferInsert>
) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);

  await db
    .update(raffles)
    .set({ status, updatedAt: new Date(), ...extra })
    .where(eq(raffles.id, raffleId));

  const updated = await getRaffleWithStats(raffleId, streamerId);
  publishRaffleEvent(raffleId, { type: "status_changed", data: { status } });
  publishRaffleEvent(raffleId, { type: "snapshot", data: updated });
  return updated;
}

export async function startRaffle(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);
  if (raffle.status !== "draft" && raffle.status !== "paused") {
    throw new HttpError("Sorteio não pode ser iniciado neste estado", 400);
  }

  const active = await getActiveRaffleForStreamer(streamerId);
  if (active && active.id !== raffleId) {
    throw new HttpError("Já existe um sorteio ativo neste canal", 409);
  }

  return setRaffleStatus(raffleId, streamerId, "active", {
    startedAt: raffle.startedAt ?? new Date(),
  });
}

export async function pauseRaffle(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle || raffle.status !== "active") {
    throw new HttpError("Sorteio não está ativo", 400);
  }
  return setRaffleStatus(raffleId, streamerId, "paused");
}

export async function resumeRaffle(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle || raffle.status !== "paused") {
    throw new HttpError("Sorteio não está pausado", 400);
  }
  return setRaffleStatus(raffleId, streamerId, "active");
}

export async function closeRaffle(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle || !["active", "paused"].includes(raffle.status)) {
    throw new HttpError("Sorteio não pode ser encerrado", 400);
  }
  return setRaffleStatus(raffleId, streamerId, "closed", { closedAt: new Date() });
}

export async function reopenRaffle(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle || raffle.status !== "closed") {
    throw new HttpError("Sorteio não está fechado", 400);
  }
  return setRaffleStatus(raffleId, streamerId, "active");
}

export async function cancelRaffle(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);
  if (raffle.status === "completed") {
    throw new HttpError("Sorteio já concluído", 400);
  }
  return setRaffleStatus(raffleId, streamerId, "cancelled");
}

export async function addRaffleChatMessage(input: {
  raffleId: string;
  twitchUserId: string;
  twitchLogin: string;
  displayName: string;
  message: string;
  messageType?: RaffleChatMessageRow["messageType"];
}) {
  const now = new Date();
  const [inserted] = await db
    .insert(raffleChatMessages)
    .values({
      raffleId: input.raffleId,
      twitchUserId: input.twitchUserId,
      twitchLogin: input.twitchLogin.toLowerCase(),
      displayName: input.displayName,
      message: input.message.slice(0, 500),
      messageType: input.messageType ?? "chat",
      sentAt: now,
    })
    .returning();

  const mapped = mapMessage(inserted!);
  publishRaffleEvent(input.raffleId, { type: "messages", data: [mapped] });
  return mapped;
}

export async function getRaffleEntryForUser(raffleId: string, twitchUserId: string) {
  const [existing] = await db
    .select()
    .from(raffleEntries)
    .where(
      and(eq(raffleEntries.raffleId, raffleId), eq(raffleEntries.twitchUserId, twitchUserId))
    )
    .limit(1);
  return existing ? mapEntry(existing) : null;
}

export async function insertRaffleEntry(input: {
  raffleId: string;
  twitchUserId: string;
  twitchLogin: string;
  displayName: string;
  source?: RaffleEntryRow["source"];
  entryCount?: number;
}): Promise<{ entry: RaffleEntryRow; created: boolean }> {
  const raffle = await getRaffleById(input.raffleId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);

  const [existing] = await db
    .select()
    .from(raffleEntries)
    .where(
      and(
        eq(raffleEntries.raffleId, input.raffleId),
        eq(raffleEntries.twitchUserId, input.twitchUserId)
      )
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    const nextCount = Math.min(
      existing.entryCount + (input.entryCount ?? 1),
      raffle.maxEntriesPerUser
    );
    if (nextCount === existing.entryCount) {
      return { entry: mapEntry(existing), created: false };
    }
    await db
      .update(raffleEntries)
      .set({ entryCount: nextCount, displayName: input.displayName })
      .where(eq(raffleEntries.id, existing.id));
    const [updated] = await db
      .select()
      .from(raffleEntries)
      .where(eq(raffleEntries.id, existing.id))
      .limit(1);
    const entry = mapEntry(updated!);
    publishRaffleEvent(input.raffleId, { type: "entries_added", data: [entry] });
    const counts = await countEntries(input.raffleId);
    publishRaffleEvent(input.raffleId, { type: "entry_count", data: counts.entriesCount });
    return { entry, created: false };
  }

  const id = crypto.randomUUID();
  await db.insert(raffleEntries).values({
    id,
    raffleId: input.raffleId,
    twitchUserId: input.twitchUserId,
    twitchLogin: input.twitchLogin.toLowerCase(),
    displayName: input.displayName,
    entryCount: Math.min(input.entryCount ?? 1, raffle.maxEntriesPerUser),
    source: input.source ?? "chat",
    enteredAt: now,
  });

  const [row] = await db.select().from(raffleEntries).where(eq(raffleEntries.id, id)).limit(1);
  const entry = mapEntry(row!);
  publishRaffleEvent(input.raffleId, { type: "entries_added", data: [entry] });
  const counts = await countEntries(input.raffleId);
  publishRaffleEvent(input.raffleId, { type: "entry_count", data: counts.entriesCount });
  return { entry, created: true };
}

export async function removeRaffleEntry(
  raffleId: string,
  streamerId: string,
  entryId: string
) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);
  if (["completed", "drawing"].includes(raffle.status)) {
    throw new HttpError("Não é possível remover entradas agora", 400);
  }

  await db
    .delete(raffleEntries)
    .where(and(eq(raffleEntries.id, entryId), eq(raffleEntries.raffleId, raffleId)));

  const updated = await getRaffleWithStats(raffleId, streamerId);
  publishRaffleEvent(raffleId, { type: "entry_count", data: updated.entriesCount });
  publishRaffleEvent(raffleId, { type: "snapshot", data: updated });
  return updated;
}

function pickWeightedWinner(
  entries: RaffleEntryRow[],
  excludeUserIds: Set<string>
): RaffleEntryRow | null {
  const pool = entries.filter((e) => !excludeUserIds.has(e.twitchUserId));
  if (pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, e) => sum + e.entryCount, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.entryCount;
    if (roll <= 0) return entry;
  }
  return pool[pool.length - 1] ?? null;
}

export async function drawRaffleWinners(raffleId: string, streamerId: string) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);
  if (raffle.status === "completed") {
    return getRaffleWithStats(raffleId, streamerId);
  }
  if (!["closed", "active", "paused"].includes(raffle.status)) {
    throw new HttpError("Sorteio não está pronto para sortear", 400);
  }

  const existingWinners = await listWinnersWithEntries(raffleId);
  const activeWinners = existingWinners.filter((w) => w.status !== "rerolled");
  if (activeWinners.length >= raffle.winnerCount) {
    return getRaffleWithStats(raffleId, streamerId);
  }

  await db
    .update(raffles)
    .set({ status: "drawing", updatedAt: new Date() })
    .where(eq(raffles.id, raffleId));

  const entryRows = await db
    .select()
    .from(raffleEntries)
    .where(eq(raffleEntries.raffleId, raffleId));
  const entries = entryRows.map(mapEntry);
  if (entries.length === 0) throw new HttpError("Nenhum participante para sortear", 400);

  const exclude = new Set(
    activeWinners.map((w) => w.twitchUserId).filter(Boolean) as string[]
  );
  const needed = raffle.winnerCount - activeWinners.length;
  const drawn: RaffleWinnerRow[] = [];

  for (let i = 0; i < needed; i += 1) {
    const pick = pickWeightedWinner(entries, exclude);
    if (!pick) break;
    exclude.add(pick.twitchUserId);

    const winnerId = crypto.randomUUID();
    const position = activeWinners.length + drawn.length + 1;
    const now = new Date();

    await db.insert(raffleWinners).values({
      id: winnerId,
      raffleId,
      entryId: pick.id,
      position,
      drawnAt: now,
      status: "pending",
    });

    const winner: RaffleWinnerRow = {
      id: winnerId,
      raffleId,
      entryId: pick.id,
      position,
      drawnAt: now,
      confirmedAt: null,
      rerolledAt: null,
      rerollReason: null,
      status: "pending",
      twitchUserId: pick.twitchUserId,
      twitchLogin: pick.twitchLogin,
      displayName: pick.displayName,
    };
    drawn.push(winner);
    publishRaffleEvent(raffleId, { type: "winner_drawn", data: winner });

    await addRaffleChatMessage({
      raffleId,
      twitchUserId: "system",
      twitchLogin: "system",
      displayName: "Sistema",
      message: `🏆 ${pick.displayName} foi sorteado(a)!`,
      messageType: "system",
    });
  }

  await db
    .update(raffles)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(raffles.id, raffleId));

  const updated = await getRaffleWithStats(raffleId, streamerId);
  publishRaffleEvent(raffleId, { type: "status_changed", data: { status: "completed" } });
  publishRaffleEvent(raffleId, { type: "snapshot", data: updated });
  return updated;
}

export async function rerollRaffleWinner(
  raffleId: string,
  streamerId: string,
  winnerId: string,
  reason?: string
) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);

  const [winner] = await db
    .select()
    .from(raffleWinners)
    .where(and(eq(raffleWinners.id, winnerId), eq(raffleWinners.raffleId, raffleId)))
    .limit(1);
  if (!winner) throw new HttpError("Vencedor não encontrado", 404);

  await db
    .update(raffleWinners)
    .set({ status: "rerolled", rerolledAt: new Date(), rerollReason: reason ?? null })
    .where(eq(raffleWinners.id, winnerId));

  const entryRows = await db.select().from(raffleEntries).where(eq(raffleEntries.raffleId, raffleId));
  const entries = entryRows.map(mapEntry);
  const allWinners = await listWinnersWithEntries(raffleId);
  const exclude = new Set(
    allWinners.filter((w) => w.status !== "rerolled").map((w) => w.twitchUserId!)
  );

  const pick = pickWeightedWinner(entries, exclude);
  if (!pick) throw new HttpError("Sem participantes elegíveis para re-rolar", 400);

  const newWinnerId = crypto.randomUUID();
  const now = new Date();
  await db.insert(raffleWinners).values({
    id: newWinnerId,
    raffleId,
    entryId: pick.id,
    position: winner.position,
    drawnAt: now,
    status: "pending",
  });

  const newWinner: RaffleWinnerRow = {
    id: newWinnerId,
    raffleId,
    entryId: pick.id,
    position: winner.position,
    drawnAt: now,
    confirmedAt: null,
    rerolledAt: null,
    rerollReason: null,
    status: "pending",
    twitchUserId: pick.twitchUserId,
    twitchLogin: pick.twitchLogin,
    displayName: pick.displayName,
  };

  publishRaffleEvent(raffleId, { type: "winner_drawn", data: newWinner });
  return getRaffleWithStats(raffleId, streamerId);
}

export async function confirmRaffleWinner(
  raffleId: string,
  streamerId: string,
  winnerId: string
) {
  const raffle = await getRaffleById(raffleId, streamerId);
  if (!raffle) throw new HttpError("Sorteio não encontrado", 404);

  await db
    .update(raffleWinners)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(and(eq(raffleWinners.id, winnerId), eq(raffleWinners.raffleId, raffleId)));

  return getRaffleWithStats(raffleId, streamerId);
}

export async function listRaffleHistory(streamerId: string, limit = 30) {
  const rows = await db
    .select()
    .from(raffles)
    .where(eq(raffles.streamerId, streamerId))
    .orderBy(desc(raffles.createdAt))
    .limit(limit);

  const result = [];
  for (const row of rows) {
    const counts = await countEntries(row.id);
    const winners = await listWinnersWithEntries(row.id);
    result.push({
      ...mapRaffle(row),
      ...counts,
      winners: winners.filter((w) => w.status !== "rerolled"),
    });
  }
  return result;
}

export async function getActiveRaffleForChannel(
  channelId: string
): Promise<RaffleRow | null> {
  const [row] = await db
    .select()
    .from(raffles)
    .where(
      and(
        eq(raffles.channelId, channelId),
        inArray(raffles.status, ["active", "paused"])
      )
    )
    .orderBy(desc(raffles.startedAt))
    .limit(1);
  return row ? mapRaffle(row) : null;
}

export async function getActiveRaffleForStreamer(streamerId: string) {
  const [row] = await db
    .select()
    .from(raffles)
    .where(
      and(
        eq(raffles.streamerId, streamerId),
        inArray(raffles.status, ["active", "paused", "closed", "drawing"])
      )
    )
    .orderBy(desc(raffles.updatedAt))
    .limit(1);
  return row ? mapRaffle(row) : null;
}

export async function getActiveRaffleBotSnapshot(
  streamerId: string
): Promise<BotActiveRaffleSnapshot | null> {
  const [row] = await db
    .select()
    .from(raffles)
    .where(
      and(eq(raffles.streamerId, streamerId), inArray(raffles.status, ["active", "paused"]))
    )
    .orderBy(desc(raffles.startedAt))
    .limit(1);
  if (!row) return null;

  const entryRows = await db
    .select()
    .from(raffleEntries)
    .where(eq(raffleEntries.raffleId, row.id));

  return {
    id: row.id,
    name: row.title ?? row.keyword ?? "Sorteio",
    keyword: row.keyword,
    mode: row.mode as RaffleMode,
    status: row.status as RaffleStatus,
    pointsCost: row.pointsCost,
    entries: entryRows.map((e) => e.twitchUserId),
  };
}

export async function resolveStreamerByChannelId(channelId: string) {
  return getStreamerByTwitchId(channelId);
}
