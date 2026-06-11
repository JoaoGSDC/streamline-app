import type { BotRaffleEntryRequest, BotRaffleEntryResponse } from "@/types/raffle";
import {
  addRaffleChatMessage,
  getActiveRaffleForChannel,
  getRaffleEntryForUser,
  insertRaffleEntry,
} from "@lib/raffles-db-queries";
import { adjustViewerPoints, getViewerBalance } from "@lib/economy-db-queries";
import { createRandomString } from "@utils/factories/create-random-string";
import type { RaffleRow } from "@/types/raffle";

const entryRateLimit = new Map<string, number[]>();
const RATE_LIMIT_MAX = 200;
const RATE_LIMIT_WINDOW_MS = 1000;

function checkRateLimit(channelId: string): boolean {
  const now = Date.now();
  const key = channelId;
  const hits = (entryRateLimit.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  hits.push(now);
  entryRateLimit.set(key, hits);
  return true;
}

function normalizeKeyword(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("!") ? trimmed : `!${trimmed}`;
}

function isEligible(
  raffle: RaffleRow,
  meta: BotRaffleEntryRequest["userMeta"]
): string | null {
  if (raffle.excludeMods && meta.isMod) return "Moderadores não podem participar";
  if (raffle.excludeVips && meta.isVip) return "VIPs não podem participar";

  if (raffle.mode === "sub_only" || raffle.requireSub) {
    if (!meta.isSub) return "Apenas inscritos podem participar";
    if (meta.subTier && !raffle.allowedSubTiers.includes(meta.subTier)) {
      return "Tier de inscrição não elegível";
    }
  }

  if (raffle.mode === "vip_only" || raffle.requireVip) {
    if (!meta.isVip) return "Apenas VIPs podem participar";
  }

  if (raffle.mode === "follower_only" || raffle.requireFollower) {
    if (!meta.isFollower) return "Apenas seguidores podem participar";
    if (meta.followDays < raffle.minFollowDays) {
      return `É necessário seguir há pelo menos ${raffle.minFollowDays} dias`;
    }
  }

  return null;
}

export async function processBotRaffleEntry(
  input: BotRaffleEntryRequest
): Promise<BotRaffleEntryResponse> {
  if (!checkRateLimit(input.channelId)) {
    return { accepted: false, message: "Muitas entradas — tente novamente.", reason: "raffle_not_active" };
  }

  const raffle = await getActiveRaffleForChannel(input.channelId);
  if (!raffle || raffle.status !== "active") {
    return {
      accepted: false,
      message: "Não há sorteio aberto agora.",
      reason: "raffle_not_active",
    };
  }

  if (raffle.mode === "manual") {
    return {
      accepted: false,
      message: "Este sorteio é manual — aguarde o streamer adicionar você.",
      reason: "not_eligible",
    };
  }

  if (raffle.mode === "keyword") {
    const keyword = normalizeKeyword(raffle.keyword ?? "");
    const message = normalizeKeyword(input.message.split(/\s+/)[0] ?? input.message);
    if (message !== keyword) {
      return {
        accepted: false,
        message: `Use ${keyword} para participar.`,
        reason: "not_eligible",
      };
    }
  }

  const eligibilityError = isEligible(raffle, input.userMeta);
  if (eligibilityError) {
    return { accepted: false, message: eligibilityError, reason: "not_eligible" };
  }

  const existing = await getRaffleEntryForUser(raffle.id, input.twitchUserId);
  if (existing && existing.entryCount >= raffle.maxEntriesPerUser) {
    return {
      accepted: false,
      message: "Você já está participando deste sorteio.",
      reason: "already_entered",
    };
  }

  if (raffle.pointsCost > 0) {
    const balance = await getViewerBalance(raffle.streamerId, input.twitchUserId);
    const currentPoints = balance.channel?.points ?? 0;
    if (currentPoints < raffle.pointsCost) {
      return {
        accepted: false,
        message: `Pontos insuficientes (necessário ${raffle.pointsCost}).`,
        reason: "insufficient_points",
      };
    }

    await adjustViewerPoints({
      auditId: createRandomString(16),
      streamerId: raffle.streamerId,
      actorUserId: "bot",
      actorUsername: "bot",
      twitchUserId: input.twitchUserId,
      twitchUsername: input.twitchLogin,
      displayName: input.displayName,
      viewerId: `viewer-${input.twitchUserId}`,
      delta: -raffle.pointsCost,
      reason: `Entrada no sorteio: ${raffle.title ?? raffle.keyword ?? raffle.id}`,
    });
  }

  const { entry, created } = await insertRaffleEntry({
    raffleId: raffle.id,
    twitchUserId: input.twitchUserId,
    twitchLogin: input.twitchLogin,
    displayName: input.displayName,
    source: "chat",
  });

  await addRaffleChatMessage({
    raffleId: raffle.id,
    twitchUserId: input.twitchUserId,
    twitchLogin: input.twitchLogin,
    displayName: input.displayName,
    message: input.message,
    messageType: "entry",
  });

  return {
    accepted: true,
    message: created
      ? `Você entrou no sorteio! Boa sorte, ${input.displayName} 🍀`
      : "Entrada registrada!",
  };
}
