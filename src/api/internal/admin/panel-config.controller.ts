import { NextRequest } from "next/server";
import { z } from "zod";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  getPanelConfigForStreamer,
  savePanelConfigOverrides,
} from "@server/panel/panel-config.service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

const patchSchema = z.object({
  overrides: z.record(z.string(), z.boolean()).optional(),
});

/** @deprecated Prefer GET /api/panel/config */
export async function getPanelConfigController(request: NextRequest) {
  try {
    const resolved = await resolveActingStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status);
    }

    const config = await getPanelConfigForStreamer(resolved.streamerId);
    if (!config) {
      return jsonError("Canal não encontrado", 404, "NOT_FOUND");
    }

    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar personalização do painel");
  }
}

/** @deprecated Prefer PUT /api/panel/config */
export async function patchPanelConfigController(request: NextRequest) {
  try {
    const resolved = await resolveActingStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status);
    }

    if (resolved.user.id !== resolved.streamerId) {
      return jsonError(
        "Apenas o dono do canal pode personalizar o painel",
        403,
        "OWNER_ONLY"
      );
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400, "VALIDATION_ERROR");
    }

    if (!parsed.data.overrides || Object.keys(parsed.data.overrides).length === 0) {
      return jsonError("Informe ao menos um override", 400, "VALIDATION_ERROR");
    }

    const result = await savePanelConfigOverrides(
      resolved.streamerId,
      parsed.data.overrides
    );

    const config = await getPanelConfigForStreamer(resolved.streamerId);

    return jsonSuccess({
      ...config,
      savedKeys: result.savedKeys,
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao salvar personalização do painel");
  }
}
