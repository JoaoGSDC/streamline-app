import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import { listActiveBotChannelsForService } from "@lib/bot-db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function listBotActiveChannelsController(request: NextRequest) {
  try {
    if (!assertBotServiceToken(request)) {
      return jsonError("Não autorizado", 401, "UNAUTHORIZED");
    }

    const channels = await listActiveBotChannelsForService();

    return jsonSuccess({
      channels: channels.map((channel) => ({
        streamerId: channel.streamerId,
        twitchUsername: channel.twitchUsername,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar canais com bot ativo");
  }
}
