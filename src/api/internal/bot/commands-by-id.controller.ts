import { NextRequest } from "next/server";
import { resolveActiveBotChannelManager } from "@lib/bot-auth";
import { buildCommandAuditDiff, recordBotAudit } from "@lib/bot-audit";
import { invalidateCommandCache } from "@lib/bot-command-cache";
import {
  findBotCommandTriggerConflict,
  getBotCommandById,
  isBuiltinBotCommand,
  softDeleteBotCommand,
  updateBotCommand,
} from "@lib/bot-db-queries";
import { commandDtoToValidationShape } from "@server/bot/bot.validators";
import {
  formatZodErrorMessages,
  updateBotCommandSchema,
  validateMergedBotCommandUpdate,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { HttpError } from "@server/utils/http-error";
import { createRandomString } from "@utils/factories/create-random-string";
import {
  collectTriggersForConflictCheck,
  enforceBotCommandMutationRateLimit,
  formatTriggerConflictMessage,
  logInvalidRegexAttempt,
  resolveActorUsername,
} from "./bot-commands-shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function getBotCommandByIdController(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveActiveBotChannelManager(_request);
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
    const resolved = await resolveActiveBotChannelManager(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const rateLimited = enforceBotCommandMutationRateLimit(resolved.user.id);
    if (rateLimited) return rateLimited;

    const { id } = await context.params;
    const existing = await getBotCommandById(id, resolved.streamerId);
    if (!existing) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    const body = await request.json();

    const parsed = updateBotCommandSchema.safeParse(body);
    if (!parsed.success) {
      await logInvalidRegexAttempt({
        streamerId: resolved.streamerId,
        actor: resolved.user,
        error: parsed.error,
        body,
        targetId: id,
      });
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const mergedValidation = validateMergedBotCommandUpdate(existing, parsed.data);
    if (!mergedValidation.success) {
      await logInvalidRegexAttempt({
        streamerId: resolved.streamerId,
        actor: resolved.user,
        error: mergedValidation.error,
        body,
        targetId: id,
      });
      return jsonError(
        formatZodErrorMessages(mergedValidation.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const conflict = await findBotCommandTriggerConflict(
      resolved.streamerId,
      collectTriggersForConflictCheck({
        trigger: parsed.data.trigger ?? existing.trigger,
        aliases: parsed.data.aliases ?? existing.aliases,
      }),
      id
    );
    if (conflict) {
      return jsonError(
        formatTriggerConflictMessage(conflict),
        409,
        "CONFLICT"
      );
    }

    const { command, configVersion } = await updateBotCommand(
      id,
      resolved.streamerId,
      {
        ...parsed.data,
        ...(parsed.data.response !== undefined
          ? { isActionResponse: parsed.data.isActionResponse ?? existing.isActionResponse }
          : {}),
      }
    );

    if (!command) {
      throw new HttpError("Comando não encontrado", 404, "NOT_FOUND");
    }

    await recordBotAudit({
      id: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolveActorUsername(resolved.user),
      targetType: "bot_command",
      targetId: id,
      action: "command_updated",
      diff: buildCommandAuditDiff(
        commandDtoToValidationShape(existing) as Record<string, unknown>,
        commandDtoToValidationShape(command) as Record<string, unknown>
      ),
    });
    invalidateCommandCache(resolved.streamerId);

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
    const resolved = await resolveActiveBotChannelManager(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const rateLimited = enforceBotCommandMutationRateLimit(resolved.user.id);
    if (rateLimited) return rateLimited;

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

    await recordBotAudit({
      id: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolveActorUsername(resolved.user),
      targetType: "bot_command",
      targetId: id,
      action: "command_deleted",
      diff: buildCommandAuditDiff(
        commandDtoToValidationShape(existing) as Record<string, unknown>,
        { deleted: true }
      ),
    });
    invalidateCommandCache(resolved.streamerId);

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
