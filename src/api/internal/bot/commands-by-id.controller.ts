import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  getBotCommandById,
  getBotCommandByTrigger,
  isBuiltinBotCommand,
  softDeleteBotCommand,
  updateBotCommand,
} from "@lib/bot-db-queries";
import { getBuiltinDefinition } from "@server/bot/bot-builtin-commands";
import {
  formatZodErrorMessages,
  updateBotBuiltinCommandSchema,
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
    const resolved = await resolveActiveBotOwnerStreamerId(_request);
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
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotCommandById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    const body = await request.json();

    if (isBuiltinBotCommand(existing)) {
      const parsed = updateBotBuiltinCommandSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(
          formatZodErrorMessages(parsed.error),
          400,
          "VALIDATION_ERROR"
        );
      }

      const builtinDef = existing.builtinKey
        ? getBuiltinDefinition(existing.builtinKey)
        : undefined;

      if (
        parsed.data.response !== undefined &&
        builtinDef &&
        !builtinDef.customizableResponse
      ) {
        return jsonError(
          "Este comando padrão é processado automaticamente e não permite personalizar a mensagem.",
          400,
          "BUILTIN_RESPONSE_NOT_CUSTOMIZABLE"
        );
      }

      const builtinPatch: Partial<{ response: string; enabled: boolean }> = {};
      if (parsed.data.response !== undefined) {
        builtinPatch.response = parsed.data.response;
      }
      if (parsed.data.enabled !== undefined) {
        builtinPatch.enabled = parsed.data.enabled;
      }

      const { command, configVersion } = await updateBotCommand(
        id,
        resolved.streamerId,
        builtinPatch
      );

      if (!command) {
        throw new HttpError("Comando não encontrado", 404, "NOT_FOUND");
      }

      return jsonSuccess({ ...command, configVersion });
    }

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
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const existing = await getBotCommandById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    if (isBuiltinBotCommand(existing)) {
      return jsonError(
        "Comandos padrão não podem ser removidos — desative-os se não quiser usá-los.",
        403,
        "BUILTIN_NOT_DELETABLE"
      );
    }

    const { configVersion } = await softDeleteBotCommand(
      id,
      resolved.streamerId
    );

    return jsonSuccess({ ok: true, configVersion });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "BUILTIN_COMMAND_NOT_DELETABLE"
    ) {
      return jsonError(
        "Comandos padrão não podem ser removidos.",
        403,
        "BUILTIN_NOT_DELETABLE"
      );
    }
    return handleRouteError(error, "Falha ao excluir comando");
  }
}
