import { NextRequest } from "next/server";
import { z } from "zod";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  checkFeatureForStreamer,
  getPanelConfigForStreamer,
  savePanelConfigOverrides,
} from "@server/panel/panel-config.service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

const putSchema = z.object({
  overrides: z
    .record(z.string().max(80), z.boolean())
    .refine((value) => Object.keys(value).length <= 100, {
      message: "Máximo de 100 overrides por requisição",
    }),
});

export async function getPanelConfigHandler(request: NextRequest) {
  try {
    const resolved = await resolveActingStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, "UNAUTHORIZED");
    }

    const config = await getPanelConfigForStreamer(resolved.streamerId);
    if (!config) {
      return jsonError("Canal não encontrado", 404, "NOT_FOUND");
    }

    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar config do painel");
  }
}

export async function putPanelConfigHandler(request: NextRequest) {
  try {
    const resolved = await resolveActingStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, "UNAUTHORIZED");
    }

    if (resolved.user.id !== resolved.streamerId) {
      return jsonError(
        "Apenas o dono do canal pode personalizar o painel",
        403,
        "OWNER_ONLY"
      );
    }

    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Payload inválido", 400, "VALIDATION_ERROR");
    }

    const result = await savePanelConfigOverrides(
      resolved.streamerId,
      parsed.data.overrides
    );

    return jsonSuccess({
      success: true,
      savedKeys: result.savedKeys,
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao salvar config do painel");
  }
}

export async function checkPanelFeatureHandler(request: NextRequest) {
  try {
    const resolved = await resolveActingStreamerId(request);
    if ("error" in resolved) {
      return jsonSuccess({ enabled: false, locked: true });
    }

    const featureKey = request.nextUrl.searchParams.get("feature")?.trim();
    if (!featureKey) {
      return jsonError("Parâmetro feature é obrigatório", 400, "VALIDATION_ERROR");
    }

    const state = await checkFeatureForStreamer(
      resolved.streamerId,
      featureKey
    );

    return jsonSuccess(state);
  } catch (error) {
    return handleRouteError(error, "Falha ao verificar feature do painel");
  }
}
