import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import { listBotTimers } from "@lib/bot-db-queries";
import { getStreamerById } from "@lib/db-queries";
import {
  BOT_GLOBAL_VARIABLES,
  BOT_TIMER_VARIABLE_HINT,
  BOT_CATEGORY_LABELS,
  type BotVariableDefinition,
} from "@server/bot/bot-variables.catalog";
import { BOT_BUILTIN_COMMANDS } from "@server/bot/bot-builtin-commands";
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
      counters: dynamicCounters,
      timers: dynamicTimers,
      builtinCommands: BOT_BUILTIN_COMMANDS.map((command) => ({
        trigger: command.trigger,
        description: command.description,
      })),
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar variáveis");
  }
}
