import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import { getStreamerById } from "@lib/db-queries";
import {
  adjustViewerPoints,
  botAwardPoints,
  botAwardXp,
  claimEconomyLiveReward,
  getChannelRanking,
  getEconomyConfigSnapshot,
  getEconomyConfigVersion,
  getViewerBalance,
  isViewerBlockedFromPoints,
  setViewerPoints,
  upsertChannelViewer,
} from "@lib/economy-db-queries";
import {
  botAdjustPointsSchema,
  botAwardPointsSchema,
  botAwardXpSchema,
  botClaimLiveRewardSchema,
  botSyncViewerSchema,
  formatZodErrorMessages,
} from "@server/economy/economy.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";
import { twitchServerService } from "@server/twitch/twitch.service";

function assertM2M(request: NextRequest) {
  if (!assertBotServiceToken(request)) {
    return jsonError("Não autorizado", 401, "UNAUTHORIZED");
  }
  return null;
}

async function assertStreamerChannel(streamerId: string) {
  const streamer = await getStreamerById(streamerId);
  if (!streamer) {
    return jsonError("Canal não encontrado", 404, "NOT_FOUND");
  }
  return null;
}

async function assertM2MAndStreamer(request: NextRequest, streamerId: string) {
  const authError = assertM2M(request);
  if (authError) return authError;
  return assertStreamerChannel(streamerId);
}

function mapBotBalanceResponse(balance: Awaited<ReturnType<typeof getViewerBalance>>) {
  if (!balance.channel) {
    return { channel: null };
  }
  return {
    channel: {
      twitchUserId: balance.channel.twitchUserId,
      twitchUsername: balance.channel.twitchUsername,
      displayName: balance.channel.displayName,
      points: balance.channel.points,
      xp: balance.channel.xp,
      level: balance.channel.level,
      levelTitle: balance.channel.levelTitle ?? undefined,
    },
  };
}

export async function getEconomyInternalConfigController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const sinceVersion = parseInt(
      request.nextUrl.searchParams.get("sinceVersion") ?? "0",
      10
    );
    const currentVersion = await getEconomyConfigVersion(streamerId);

    if (sinceVersion > 0 && sinceVersion >= currentVersion) {
      return new Response(null, {
        status: 304,
        headers: { "X-Economy-Config-Version": String(currentVersion) },
      });
    }

    const config = await getEconomyConfigSnapshot(streamerId);

    return jsonSuccess(
      { configVersion: currentVersion, ...config },
      200,
      { "X-Economy-Config-Version": String(currentVersion) }
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar config de economia");
  }
}

export async function getEconomyInternalBalanceController(
  request: NextRequest,
  streamerId: string,
  twitchUserId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const balance = await getViewerBalance(streamerId, twitchUserId);
    return jsonSuccess(mapBotBalanceResponse(balance));
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar saldo");
  }
}

export async function getEconomyInternalRankingController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    const ranking = await getChannelRanking(streamerId, {
      search,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 10 : limit,
    });

    return jsonSuccess(ranking);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar ranking");
  }
}

export async function postEconomyInternalSyncViewerController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const body = await request.json();
    const parsed = botSyncViewerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const viewer = await upsertChannelViewer({
      id: createRandomString(12),
      streamerId,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
    });

    return jsonSuccess(viewer);
  } catch (error) {
    return handleRouteError(error, "Falha ao sincronizar viewer");
  }
}

export async function postEconomyInternalAwardPointsController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const body = await request.json();
    const parsed = botAwardPointsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await botAwardPoints({
      streamerId,
      viewerId: createRandomString(12),
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      basePoints: parsed.data.basePoints,
      multiplier: parsed.data.multiplier,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao conceder pontos");
  }
}

export async function postEconomyInternalAwardXpController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const body = await request.json();
    const parsed = botAwardXpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await botAwardXp({
      streamerId,
      viewerId: createRandomString(12),
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      xpAmount: parsed.data.xpAmount,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao conceder XP");
  }
}

export async function postEconomyInternalAdjustPointsController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const body = await request.json();
    const parsed = botAdjustPointsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const targetUsername = parsed.data.targetTwitchUsername
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    let targetUserId = parsed.data.targetTwitchUserId?.trim();
    let targetDisplayName = parsed.data.targetDisplayName?.trim();

    if (!targetUserId || !targetDisplayName) {
      const twitchUser = await twitchServerService.getUserByLogin(targetUsername);
      if (!twitchUser) {
        return jsonError("Viewer alvo não encontrado na Twitch", 404, "NOT_FOUND");
      }
      targetUserId = twitchUser.id;
      targetDisplayName = targetDisplayName ?? twitchUser.displayName;
    }

    const commandLabel = parsed.data.commandKey ?? "comando";
    const reason =
      parsed.data.reason?.trim() ||
      `Ajuste manual via ${commandLabel} por @${parsed.data.actorTwitchUsername}`;

    const viewerId = createRandomString(12);
    const actorUserId = parsed.data.actorTwitchUserId;
    const actorUsername = parsed.data.actorTwitchUsername;

    if (parsed.data.action === "set") {
      const blocked = await isViewerBlockedFromPoints(
        streamerId,
        targetUserId,
        targetUsername
      );
      if (blocked) {
        const current = await getViewerBalance(streamerId, targetUserId);
        const currentPoints = current.channel?.points ?? 0;
        if (parsed.data.amount > currentPoints) {
          return jsonError(
            "Usuário bloqueado de receber pontos",
            403,
            "USER_BLOCKED"
          );
        }
      }

      const viewer = await setViewerPoints({
        auditId: createRandomString(16),
        streamerId,
        actorUserId,
        actorUsername,
        twitchUserId: targetUserId,
        twitchUsername: targetUsername,
        displayName: targetDisplayName,
        viewerId,
        points: parsed.data.amount,
        reason,
      });

      return jsonSuccess({
        action: "set",
        amount: parsed.data.amount,
        viewer,
        totalPoints: viewer.points,
      });
    }

    if (parsed.data.amount <= 0) {
      return jsonError("Informe uma quantidade maior que zero", 400, "VALIDATION_ERROR");
    }

    const delta =
      parsed.data.action === "remove" ? -parsed.data.amount : parsed.data.amount;

    if (delta > 0) {
      const blocked = await isViewerBlockedFromPoints(
        streamerId,
        targetUserId,
        targetUsername
      );
      if (blocked) {
        return jsonError(
          "Usuário bloqueado de receber pontos",
          403,
          "USER_BLOCKED"
        );
      }
    }

    const viewer = await adjustViewerPoints({
      auditId: createRandomString(16),
      streamerId,
      actorUserId,
      actorUsername,
      twitchUserId: targetUserId,
      twitchUsername: targetUsername,
      displayName: targetDisplayName,
      viewerId,
      delta,
      reason,
    });

    return jsonSuccess({
      action: parsed.data.action,
      amount: parsed.data.amount,
      viewer,
      totalPoints: viewer.points,
      pointsChanged: Math.abs(delta),
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao ajustar pontos");
  }
}

export async function postEconomyInternalLiveRewardClaimController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const gateError = await assertM2MAndStreamer(request, streamerId);
    if (gateError) return gateError;

    const body = await request.json();
    const parsed = botClaimLiveRewardSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await claimEconomyLiveReward({
      claimId: createRandomString(16),
      auditId: createRandomString(16),
      streamerId,
      rewardKey: parsed.data.rewardKey,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      streamStartedAt: parsed.data.streamStartedAt,
      viewerId: createRandomString(12),
      pointsAmount: parsed.data.pointsAmount,
    });

    return jsonSuccess({
      status: result.status,
      rewardKey: parsed.data.rewardKey,
      pointsAwarded: result.pointsAwarded,
      totalPoints: result.viewer.points,
      viewer: {
        twitchUserId: result.viewer.twitchUserId,
        twitchUsername: result.viewer.twitchUsername,
        displayName: result.viewer.displayName,
        points: result.viewer.points,
        xp: result.viewer.xp,
        level: result.viewer.level,
        levelTitle: result.viewer.levelTitle ?? undefined,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao resgatar recompensa da live");
  }
}
