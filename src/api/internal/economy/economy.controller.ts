import { NextRequest } from "next/server";
import { resolveEconomyOwnerStreamerId } from "@lib/economy-auth";
import {
  addChannelViewerManual,
  adjustUserCoins,
  adjustViewerPoints,
  getChannelRanking,
  getEconomyFullConfig,
  getEconomyOverview,
  getViewerBalance,
  listChannelViewers,
  resetAllChannelPoints,
  resetViewerEconomy,
  setViewerPoints,
  updateEconomyGeneralConfig,
  updateEconomyLevelsConfig,
  updateEconomyPointsConfig,
} from "@lib/economy-db-queries";
import {
  economyAddViewerSchema,
  economyResetAllPointsSchema,
  economySetPointsSchema,
  economyUserAdjustSchema,
  economyUserResetSchema,
  formatZodErrorMessages,
  updateEconomyGeneralSchema,
  updateEconomyLevelsSchema,
  updateEconomyPointsSchema,
} from "@server/economy/economy.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { assertFeatureAccess } from "@lib/plan";
import { assertFeatureEnabledForStreamer } from "@server/panel/assert-feature-enabled";
import { createRandomString } from "@utils/factories/create-random-string";
import { twitchServerService } from "@server/twitch/twitch.service";

export async function getEconomyOverviewController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const overview = await getEconomyOverview(resolved.streamerId);
    return jsonSuccess(overview);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar visão geral da economia");
  }
}

export async function getEconomyConfigController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const config = await getEconomyFullConfig(resolved.streamerId);
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar configurações");
  }
}

export async function patchEconomyGeneralController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = updateEconomyGeneralSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await updateEconomyGeneralConfig(resolved.streamerId, parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar configurações gerais");
  }
}

export async function patchEconomyPointsController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = updateEconomyPointsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await updateEconomyPointsConfig(resolved.streamerId, parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar configurações de pontos");
  }
}

export async function patchEconomyLevelsController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    await assertFeatureAccess(resolved.streamerId, "economy.levels");
    await assertFeatureEnabledForStreamer(resolved.streamerId, "economy.levels");

    const body = await request.json();
    const parsed = updateEconomyLevelsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await updateEconomyLevelsConfig(resolved.streamerId, parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar configurações de níveis");
  }
}

export async function listEconomyUsersController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const sortBy = (searchParams.get("sortBy") ?? "points") as
      | "points"
      | "level"
      | "activity";

    const result = await listChannelViewers(resolved.streamerId, {
      search,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 20 : limit,
      sortBy,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar usuários");
  }
}

export async function postEconomyAddViewerController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = economyAddViewerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const twitchUsername = parsed.data.twitchUsername
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    let twitchUserId = parsed.data.twitchUserId?.trim();
    let displayName = parsed.data.displayName?.trim();

    if (!twitchUserId || !displayName) {
      const twitchUser = await twitchServerService.getUserByLogin(twitchUsername);
      if (!twitchUser) {
        return jsonError("Usuário Twitch não encontrado", 404, "NOT_FOUND");
      }
      twitchUserId = twitchUser.id;
      displayName = displayName ?? twitchUser.displayName;
    }

    const viewer = await addChannelViewerManual({
      id: createRandomString(12),
      streamerId: resolved.streamerId,
      twitchUserId,
      twitchUsername,
      displayName,
    });

    const initialPoints = parsed.data.initialPoints ?? 0;
    if (initialPoints > 0) {
      const updated = await adjustViewerPoints({
        auditId: createRandomString(16),
        streamerId: resolved.streamerId,
        actorUserId: resolved.user.id,
        actorUsername:
          resolved.user.twitchUsername ?? resolved.user.name ?? resolved.user.id,
        twitchUserId,
        twitchUsername,
        displayName,
        viewerId: viewer.id,
        delta: initialPoints,
        reason: "Saldo inicial no cadastro manual",
      });
      return jsonSuccess(updated, 201);
    }

    return jsonSuccess(viewer, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao adicionar viewer");
  }
}

export async function getEconomyRankingController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const result = await getChannelRanking(resolved.streamerId, {
      search,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 20 : limit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar ranking");
  }
}

export async function getEconomyBalanceController(
  request: NextRequest,
  twitchUserId: string
) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const balance = await getViewerBalance(resolved.streamerId, twitchUserId);
    return jsonSuccess(balance);
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar saldo");
  }
}

export async function postEconomyAdjustPointsController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = economyUserAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const action = body.action as "add" | "remove";
    if (action !== "add" && action !== "remove") {
      return jsonError("Ação inválida. Use add ou remove.", 400, "VALIDATION_ERROR");
    }

    const delta = action === "add" ? parsed.data.amount : -parsed.data.amount;
    const viewer = await adjustViewerPoints({
      auditId: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolved.user.twitchUsername ?? resolved.user.name ?? resolved.user.id,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      viewerId: createRandomString(12),
      delta,
      reason: parsed.data.reason,
    });

    return jsonSuccess(viewer);
  } catch (error) {
    return handleRouteError(error, "Falha ao ajustar pontos");
  }
}

export async function postEconomySetPointsController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = economySetPointsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const viewer = await setViewerPoints({
      auditId: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername:
        resolved.user.twitchUsername ?? resolved.user.name ?? resolved.user.id,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      viewerId: createRandomString(12),
      points: parsed.data.points,
      reason: parsed.data.reason,
    });

    return jsonSuccess(viewer);
  } catch (error) {
    return handleRouteError(error, "Falha ao definir pontos");
  }
}

export async function postEconomyAdjustCoinsController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = economyUserAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const action = body.action as "add" | "remove";
    if (action !== "add" && action !== "remove") {
      return jsonError("Ação inválida. Use add ou remove.", 400, "VALIDATION_ERROR");
    }

    const delta = action === "add" ? parsed.data.amount : -parsed.data.amount;
    const coins = await adjustUserCoins({
      auditId: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolved.user.twitchUsername ?? resolved.user.name ?? resolved.user.id,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      delta,
      reason: parsed.data.reason,
    });

    return jsonSuccess(coins);
  } catch (error) {
    return handleRouteError(error, "Falha ao ajustar coins");
  }
}

export async function postEconomyResetUserController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = economyUserResetSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    if (!parsed.data.resetPoints && !parsed.data.resetXp) {
      return jsonError(
        "Selecione pelo menos reset de pontos ou XP.",
        400,
        "VALIDATION_ERROR"
      );
    }

    const viewer = await resetViewerEconomy({
      auditId: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolved.user.twitchUsername ?? resolved.user.name ?? resolved.user.id,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      viewerId: createRandomString(12),
      resetPoints: parsed.data.resetPoints,
      resetXp: parsed.data.resetXp,
      reason: parsed.data.reason,
    });

    return jsonSuccess(viewer);
  } catch (error) {
    return handleRouteError(error, "Falha ao resetar usuário");
  }
}

export async function postEconomyResetAllPointsController(request: NextRequest) {
  try {
    const resolved = await resolveEconomyOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = economyResetAllPointsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatZodErrorMessages(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await resetAllChannelPoints({
      auditId: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolved.user.twitchUsername ?? resolved.user.name ?? resolved.user.id,
      reason: parsed.data.reason,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao resetar pontos do canal");
  }
}
