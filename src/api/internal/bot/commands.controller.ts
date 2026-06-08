import { NextRequest } from "next/server";
import { resolveActiveBotChannelManager } from "@lib/bot-auth";
import { buildCommandAuditDiff, recordBotAudit } from "@lib/bot-audit";
import { invalidateCommandCache } from "@lib/bot-command-cache";
import {
  createBotCommand,
  findBotCommandTriggerConflict,
  listBotCommands,
} from "@lib/bot-db-queries";
import {
  createBotCommandSchema,
  formatZodErrorMessages,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";
import {
  advancedFieldsFromValidated,
  collectTriggersForConflictCheck,
  enforceBotCommandMutationRateLimit,
  formatTriggerConflictMessage,
  logInvalidRegexAttempt,
  resolveActorUsername,
} from "./bot-commands-shared";
import { assertFeatureEnabledForStreamer } from "@server/panel/assert-feature-enabled";

export async function listBotCommandsController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotChannelManager(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    await assertFeatureEnabledForStreamer(resolved.streamerId, "bot.commands");

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const result = await listBotCommands(resolved.streamerId, {
      search,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 50 : limit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar comandos");
  }
}

export async function createBotCommandController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotChannelManager(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const rateLimited = enforceBotCommandMutationRateLimit(resolved.user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = createBotCommandSchema.safeParse(body);
    if (!parsed.success) {
      await logInvalidRegexAttempt({
        streamerId: resolved.streamerId,
        actor: resolved.user,
        error: parsed.error,
        body,
      });
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const conflict = await findBotCommandTriggerConflict(
      resolved.streamerId,
      collectTriggersForConflictCheck(parsed.data)
    );
    if (conflict) {
      return jsonError(
        formatTriggerConflictMessage(conflict),
        409,
        "CONFLICT"
      );
    }

    const commandId = createRandomString(12);
    const { command, configVersion } = await createBotCommand({
      id: commandId,
      streamerId: resolved.streamerId,
      trigger: parsed.data.trigger,
      response: parsed.data.response,
      cooldownSeconds: parsed.data.cooldownSeconds ?? 0,
      enabled: parsed.data.enabled ?? true,
      ...advancedFieldsFromValidated(parsed.data),
    });

    await recordBotAudit({
      id: createRandomString(16),
      streamerId: resolved.streamerId,
      actorUserId: resolved.user.id,
      actorUsername: resolveActorUsername(resolved.user),
      targetType: "bot_command",
      targetId: commandId,
      action: "command_created",
      diff: buildCommandAuditDiff(null, parsed.data as Record<string, unknown>),
    });
    invalidateCommandCache(resolved.streamerId);

    return jsonSuccess({ ...command, configVersion }, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar comando");
  }
}
