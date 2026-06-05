import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import { listBotTimers } from "@lib/bot-db-queries";
import { getStreamerById } from "@lib/db-queries";
import {
  BOT_BUILTIN_CATEGORY_LABELS,
  BOT_BUILTIN_COMMANDS,
  DEFAULT_CONFIRMATION_ACCEPT_WORDS,
  DEFAULT_CONFIRMATION_REJECT_WORDS,
  DEFAULT_CONFIRMATION_TIMEOUT_SECONDS,
  DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT,
} from "@server/bot/bot-builtin-commands";
import {
  BOT_GLOBAL_VARIABLES,
  BOT_RUNTIME_TEMPLATE_VARIABLES,
  BOT_TIMER_VARIABLE_HINT,
  BOT_CATEGORY_LABELS,
  type BotVariableDefinition,
} from "@server/bot/bot-variables.catalog";
import { BOT_COMMAND_ARG_VARIABLES } from "@lib/bot-message-substitution";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function listBotVariablesController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const streamer = await getStreamerById(resolved.streamerId);
    const timers = await listBotTimers(resolved.streamerId);

    const dynamicCounters: BotVariableDefinition[] = [];
    const dynamicTimers: BotVariableDefinition[] = timers.map((timer) => ({
      key: timer.name ? `{timer:${timer.name}}` : `{timer:${timer.id}}`,
      label: timer.name ?? "Timer sem nome",
      description: `Mensagem automática a cada ${timer.intervalMinutes} min. Referência para organização.`,
      usage: timer.message.slice(0, 80),
      category: "timer" as const,
    }));

    if (dynamicTimers.length === 0) {
      dynamicTimers.push(BOT_TIMER_VARIABLE_HINT);
    }

    const globals = BOT_GLOBAL_VARIABLES.map((variable) => {
      if (variable.key === "{channel}" && streamer?.twitchUsername) {
        return {
          ...variable,
          example: streamer.twitchUsername,
        };
      }
      if (variable.key === "{streamer}" && streamer?.twitchUsername) {
        return {
          ...variable,
          example: streamer.twitchUsername,
        };
      }
      if (variable.key === "{streamerName}" && streamer?.name) {
        return {
          ...variable,
          example: streamer.name,
        };
      }
      return variable;
    });

    return jsonSuccess({
      categories: BOT_CATEGORY_LABELS,
      globals,
      commandArgs: BOT_COMMAND_ARG_VARIABLES,
      counters: dynamicCounters,
      timers: dynamicTimers,
      runtimeTemplateVariables: BOT_RUNTIME_TEMPLATE_VARIABLES,
      confirmation: {
        defaultPrompt: DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT,
        acceptWords: [...DEFAULT_CONFIRMATION_ACCEPT_WORDS],
        rejectWords: [...DEFAULT_CONFIRMATION_REJECT_WORDS],
        timeoutSeconds: DEFAULT_CONFIRMATION_TIMEOUT_SECONDS,
      },
      builtinCommandCategories: BOT_BUILTIN_CATEGORY_LABELS,
      builtinCommands: BOT_BUILTIN_COMMANDS.map((command) => ({
        key: command.key,
        trigger: command.trigger,
        description: command.description,
        category: command.category,
        minRole: command.minRole,
        argsHint: command.argsHint ?? null,
        executionKind: command.executionKind,
        customizableResponse: command.customizableResponse,
        runtimeNotes: command.runtimeNotes ?? null,
        externalApiUrlTemplate: command.externalApiUrlTemplate ?? null,
        responseTemplate: command.responseTemplate ?? null,
        requiresConfirmation: command.requiresConfirmation ?? false,
        confirmationPrompt: command.confirmationPrompt ?? null,
        economyRewardKey: command.economyRewardKey ?? null,
        economyRewardPoints: command.economyRewardPoints ?? null,
        economyBalanceCommand: command.economyBalanceCommand ?? false,
      })),
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar variáveis");
  }
}
