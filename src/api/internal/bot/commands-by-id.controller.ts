import { NextRequest } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  getBotCommandById,
  getBotCommandByTrigger,
  softDeleteBotCommand,
  updateBotCommand,
} from "@lib/bot-db-queries";
import {
  formatZodErrorMessages,
  updateBotCommandSchema,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { HttpError } from "@server/utils/http-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function getBotCommandByIdController(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveBotOwnerStreamerId(_request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const command = await getBotCommandById(id, resolved.streamerId);
    if (!command) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    return jsonSuccess(command);
  } catch (error) {
    return handleRouteError(error, "Falha ao buscar comando");
  }
}

export async function patchBotCommandController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotCommandById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    const body = await request.json();
    const parsed = updateBotCommandSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    if (parsed.data.trigger) {
      const duplicate = await getBotCommandByTrigger(
        resolved.streamerId,
        parsed.data.trigger,
        id
      );
      if (duplicate) {
        return jsonError("Já existe um comando com este trigger", 409, "CONFLICT");
      }
    }

    const { command, configVersion } = await updateBotCommand(
      id,
      resolved.streamerId,
      parsed.data
    );

    if (!command) {
      throw new HttpError("Comando não encontrado", 404, "NOT_FOUND");
    }

    return jsonSuccess({ ...command, configVersion });
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar comando");
  }
}

export async function deleteBotCommandController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotCommandById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    const { configVersion } = await softDeleteBotCommand(
      id,
      resolved.streamerId
    );

    return jsonSuccess({ ok: true, configVersion });
  } catch (error) {
    return handleRouteError(error, "Falha ao excluir comando");
  }
}
