import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import {
  getBotConfigVersion,
  isBotChannelActive,
  listActiveBotBlacklistForSnapshot,
  listActiveBotCommandsForSnapshot,
  listActiveBotTimersForSnapshot,
} from "@lib/bot-db-queries";
import { getStreamerById } from "@lib/db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

interface ChannelRouteContext {
  params: Promise<{ streamerId: string }>;
}

function assertM2M(request: NextRequest) {
  if (!assertBotServiceToken(request)) {
    return jsonError("Não autorizado", 401, "UNAUTHORIZED");
  }
  return null;
}

export async function getBotCommandsSnapshotController(
  request: NextRequest,
  context: ChannelRouteContext
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const { streamerId } = await context.params;
    const streamer = await getStreamerById(streamerId);
    if (!streamer) {
      return jsonError("Canal não encontrado", 404, "NOT_FOUND");
    }

    const active = await isBotChannelActive(streamerId);
    if (!active) {
      return jsonError("Bot não está ativo neste canal", 403, "BOT_CHANNEL_NOT_ACTIVE");
    }

    const sinceVersion = parseInt(
      request.nextUrl.searchParams.get("sinceVersion") ?? "0",
      10
    );
    const configVersion = await getBotConfigVersion(streamerId);

    if (
      !Number.isNaN(sinceVersion) &&
      sinceVersion > 0 &&
      sinceVersion === configVersion
    ) {
      return new Response(null, {
        status: 304,
        headers: { "X-Config-Version": String(configVersion) },
      });
    }

    const commands = await listActiveBotCommandsForSnapshot(streamerId);

    return jsonSuccess(
      { configVersion, commands },
      200,
      { "X-Config-Version": String(configVersion) }
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao obter snapshot de comandos");
  }
}

export async function getBotConfigSnapshotController(
  request: NextRequest,
  context: ChannelRouteContext
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const { streamerId } = await context.params;
    const streamer = await getStreamerById(streamerId);
    if (!streamer) {
      return jsonError("Canal não encontrado", 404, "NOT_FOUND");
    }

    const active = await isBotChannelActive(streamerId);
    if (!active) {
      return jsonError("Bot não está ativo neste canal", 403, "BOT_CHANNEL_NOT_ACTIVE");
    }

    const sinceVersion = parseInt(
      request.nextUrl.searchParams.get("sinceVersion") ?? "0",
      10
    );
    const configVersion = await getBotConfigVersion(streamerId);

    if (
      !Number.isNaN(sinceVersion) &&
      sinceVersion > 0 &&
      sinceVersion === configVersion
    ) {
      return new Response(null, {
        status: 304,
        headers: { "X-Config-Version": String(configVersion) },
      });
    }

    const [commands, timers, blacklist] = await Promise.all([
      listActiveBotCommandsForSnapshot(streamerId),
      listActiveBotTimersForSnapshot(streamerId),
      listActiveBotBlacklistForSnapshot(streamerId),
    ]);

    return jsonSuccess(
      {
        configVersion,
        commands,
        timers,
        blacklist,
        activeRaffle: null,
        counters: [],
      },
      200,
      { "X-Config-Version": String(configVersion) }
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao obter snapshot de config");
  }
}
