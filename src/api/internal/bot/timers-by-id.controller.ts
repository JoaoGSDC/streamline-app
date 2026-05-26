import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  getBotTimerById,
  softDeleteBotTimer,
  updateBotTimer,
} from "@lib/bot-db-queries";
import {
  formatZodErrorMessages,
  updateBotTimerSchema,
} from "@server/bot/bot.validators";
import { HttpError } from "@server/utils/http-error";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function patchBotTimerController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotTimerById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Timer não encontrado", 404, "NOT_FOUND");
    }

    const body = await request.json();
    const parsed = updateBotTimerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const { timer, configVersion } = await updateBotTimer(
      id,
      resolved.streamerId,
      parsed.data
    );

    if (!timer) {
      throw new HttpError("Timer não encontrado", 404, "NOT_FOUND");
    }

    return jsonSuccess({ ...timer, configVersion });
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar timer");
  }
}

export async function deleteBotTimerController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotTimerById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Timer não encontrado", 404, "NOT_FOUND");
    }

    const { configVersion } = await softDeleteBotTimer(id, resolved.streamerId);
    return jsonSuccess({ ok: true, configVersion });
  } catch (error) {
    return handleRouteError(error, "Falha ao excluir timer");
  }
}
