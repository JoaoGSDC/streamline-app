import { NextRequest } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  countBotBlacklist,
  countBotCommands,
  countBotTimers,
  getBotConfigVersion,
} from "@lib/bot-db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function getBotStatusController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const [activeCommands, activeTimers, blacklistTerms, configVersion] =
      await Promise.all([
        countBotCommands(resolved.streamerId),
        countBotTimers(resolved.streamerId),
        countBotBlacklist(resolved.streamerId),
        getBotConfigVersion(resolved.streamerId),
      ]);

    return jsonSuccess({
      botServiceStatus: "offline",
      channelConnectionStatus: "offline",
      lastSyncAt: null,
      configVersion,
      summary: {
        activeCommands,
        activeTimers,
        blacklistTerms,
      },
      message:
        "O serviço do bot ainda não está conectado. Suas configurações são salvas e serão aplicadas quando o bot estiver online.",
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar status do bot");
  }
}
