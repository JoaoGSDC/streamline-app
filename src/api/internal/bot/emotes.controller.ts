import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import { getStreamerById } from "@lib/db-queries";
import { twitchServerService } from "@server/twitch/twitch.service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function listBotChannelEmotesController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const streamer = await getStreamerById(resolved.streamerId);
    if (!streamer?.twitchId) {
      return jsonError("Canal Twitch não vinculado", 404, "NOT_FOUND");
    }

    const emotes = await twitchServerService.getChannelEmotes(streamer.twitchId);

    return jsonSuccess({
      channel: streamer.twitchUsername,
      emotes,
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar emotes do canal");
  }
}
