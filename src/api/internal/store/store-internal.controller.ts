import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import {
  createStoreRedemption,
  getPublicStoreCatalog,
  getStoreConfig,
  listStoreProducts,
  listStoreRedemptions,
} from "@lib/store-db-queries";
import { getViewerBalance } from "@lib/economy-db-queries";
import { botStoreRedeemSchema, formatStoreZodError } from "@server/store/store.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

function assertM2M(request: NextRequest) {
  if (!assertBotServiceToken(request)) {
    return jsonError("Não autorizado", 401, "UNAUTHORIZED");
  }
  return null;
}

export async function getStoreInternalConfigController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const config = await getStoreConfig(streamerId);
    return jsonSuccess(config, 200, {
      "X-Store-Config-Version": String(config.configVersion),
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar config da loja");
  }
}

export async function getStoreInternalProductsController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const result = await listStoreProducts(streamerId, {
      status: "active",
      limit: 100,
    });
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar produtos");
  }
}

export async function getStoreInternalBalanceController(
  request: NextRequest,
  streamerId: string,
  twitchUserId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const balance = await getViewerBalance(streamerId, twitchUserId);
    const config = await getStoreConfig(streamerId);
    return jsonSuccess({ ...balance, coinsAllowed: config.coinsAllowed });
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar saldo");
  }
}

export async function postStoreInternalRedeemController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = botStoreRedeemSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const redemption = await createStoreRedemption({
      id: createRandomString(16),
      streamerId,
      productId: parsed.data.productId,
      twitchUserId: parsed.data.twitchUserId,
      twitchUsername: parsed.data.twitchUsername,
      displayName: parsed.data.displayName,
      payWith: parsed.data.payWith,
      idempotencyKey: parsed.data.idempotencyKey,
      actorUserId: parsed.data.twitchUserId,
      actorUsername: parsed.data.twitchUsername,
    });

    return jsonSuccess(redemption, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao resgatar produto");
  }
}

export async function getStoreInternalRedemptionsController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const sp = request.nextUrl.searchParams;
    const result = await listStoreRedemptions(streamerId, {
      page: parseInt(sp.get("page") ?? "1", 10),
      limit: parseInt(sp.get("limit") ?? "20", 10),
    });
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar resgates");
  }
}

export async function getStoreInternalCatalogByUsernameController(
  request: NextRequest,
  username: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const catalog = await getPublicStoreCatalog(username);
    if (!catalog) return jsonError("Loja não encontrada", 404, "NOT_FOUND");
    return jsonSuccess(catalog);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar catálogo");
  }
}
