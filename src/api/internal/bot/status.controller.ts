import { NextRequest } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";
import { getRecentBotHeartbeat } from "@lib/bot-heartbeat";
import {
  countBotBlacklist,
  countBotCommands,
  countBotTimers,
  getBotConfigVersion,
  isBotChannelActive,
} from "@lib/bot-db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function getBotStatusController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const [
      activeCommands,
      activeTimers,
      blacklistTerms,
      configVersion,
      botActive,
    ] = await Promise.all([
      countBotCommands(resolved.streamerId),
      countBotTimers(resolved.streamerId),
      countBotBlacklist(resolved.streamerId),
      getBotConfigVersion(resolved.streamerId),
      isBotChannelActive(resolved.streamerId),
    ]);

    const heartbeat = await getRecentBotHeartbeat(resolved.streamerId);
    const channel = heartbeat?.channels.find(
      (item) => item.streamerId === resolved.streamerId
    );
    const botServiceStatus = heartbeat
      ? channel?.ircStatus === "degraded"
        ? "degraded"
        : "online"
      : "offline";
    const channelConnectionStatus =
      channel?.ircStatus === "connected"
        ? "online"
        : channel?.ircStatus === "degraded"
          ? "reconnecting"
          : "offline";

    return jsonSuccess({
      botActive,
      botServiceStatus,
      channelConnectionStatus,
      lastSyncAt: heartbeat?.receivedAt.toISOString() ?? null,
      configVersion,
      summary: {
        activeCommands,
        activeTimers,
        blacklistTerms,
      },
      message: heartbeat
        ? "O serviço do bot está reportando heartbeat recente."
        : "O serviço do bot ainda não está conectado. Suas configurações são salvas e serão aplicadas quando o bot estiver online.",
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar status do bot");
  }
}
