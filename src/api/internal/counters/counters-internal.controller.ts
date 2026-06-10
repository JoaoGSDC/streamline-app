import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import {
  adjustCounterFromBot,
  getCountersConfig,
  getCountersConfigVersion,
  listCountersForBotSnapshot,
} from "@lib/counters-db-queries";
import {
  botAdjustCounterSchema,
  formatCountersZodError,
} from "@server/counters/counters.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

function assertM2M(request: NextRequest) {
  if (!assertBotServiceToken(request)) {
    return jsonError("Não autorizado", 401, "UNAUTHORIZED");
  }
  return null;
}

export async function getCountersInternalConfigController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const sinceVersion = parseInt(
      request.nextUrl.searchParams.get("sinceVersion") ?? "0",
      10
    );
    const currentVersion = await getCountersConfigVersion(streamerId);

    if (sinceVersion > 0 && sinceVersion >= currentVersion) {
      return new Response(null, {
        status: 304,
        headers: { "X-Counters-Config-Version": String(currentVersion) },
      });
    }

    const [config, counters] = await Promise.all([
      getCountersConfig(streamerId),
      listCountersForBotSnapshot(streamerId),
    ]);

    return jsonSuccess(
      { configVersion: config.configVersion, enabled: config.enabled, counters },
      200,
      { "X-Counters-Config-Version": String(config.configVersion) }
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar config de contadores");
  }
}

export async function postCountersInternalAdjustController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = botAdjustCounterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatCountersZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const counter = await adjustCounterFromBot(streamerId, {
      ...parsed.data,
      source: parsed.data.source ?? "chat",
    });

    return jsonSuccess(counter);
  } catch (error) {
    return handleRouteError(error, "Falha ao ajustar contador via bot");
  }
}
