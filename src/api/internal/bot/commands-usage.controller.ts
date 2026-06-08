import { NextRequest } from "next/server";
import { resolveActiveBotChannelManager } from "@lib/bot-auth";
import {
  getBotCommandById,
  getBotCommandUsageStats,
} from "@lib/bot-db-queries";
import {
  botCommandUsagePeriodSchema,
  formatZodErrorMessages,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function getBotCommandUsageController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolved = await resolveActiveBotChannelManager(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const { id } = await context.params;
    const command = await getBotCommandById(id, resolved.streamerId);
    if (!command) {
      return jsonError("Comando não encontrado", 404, "NOT_FOUND");
    }

    const periodRaw = request.nextUrl.searchParams.get("period") ?? "stream";
    const periodParsed = botCommandUsagePeriodSchema.safeParse(periodRaw);
    if (!periodParsed.success) {
      return jsonError(
        formatZodErrorMessages(periodParsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const stats = await getBotCommandUsageStats(
      id,
      resolved.streamerId,
      periodParsed.data
    );

    return jsonSuccess(stats);
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar uso do comando");
  }
}
