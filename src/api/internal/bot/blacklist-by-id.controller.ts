import { NextRequest } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  getBotBlacklistByTerm,
  getBotBlacklistTermById,
  softDeleteBotBlacklistTerm,
  updateBotBlacklistTerm,
} from "@lib/bot-db-queries";
import {
  formatZodErrorMessages,
  updateBotBlacklistSchema,
} from "@server/bot/bot.validators";
import { HttpError } from "@server/utils/http-error";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function patchBotBlacklistController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotBlacklistTermById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Termo não encontrado", 404, "NOT_FOUND");
    }

    const body = await request.json();
    const parsed = updateBotBlacklistSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    if (parsed.data.term) {
      const duplicate = await getBotBlacklistByTerm(
        resolved.streamerId,
        parsed.data.term,
        id
      );
      if (duplicate) {
        return jsonError("Este termo já está na blacklist", 409, "CONFLICT");
      }
    }

    const { term, configVersion } = await updateBotBlacklistTerm(
      id,
      resolved.streamerId,
      parsed.data
    );

    if (!term) {
      throw new HttpError("Termo não encontrado", 404, "NOT_FOUND");
    }

    return jsonSuccess({ ...term, configVersion });
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar termo");
  }
}

export async function deleteBotBlacklistController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotBlacklistTermById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Termo não encontrado", 404, "NOT_FOUND");
    }

    const { configVersion } = await softDeleteBotBlacklistTerm(
      id,
      resolved.streamerId
    );

    return jsonSuccess({ ok: true, configVersion });
  } catch (error) {
    return handleRouteError(error, "Falha ao remover termo");
  }
}
