import { NextRequest } from "next/server";
import { upsertStreamerFromTwitch } from "@lib/db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export interface StreamerSyncResponse {
  id: string;
  partner: boolean;
  premium: boolean;
}

export async function syncStreamerController(request: NextRequest) {
  try {
    const body = await request.json();
    const twitchId = String(body.twitchId ?? body.id ?? "").trim();
    const twitchUsername = String(body.twitchUsername ?? body.login ?? "").trim();

    if (!twitchId || !twitchUsername) {
      return jsonError(
        "twitchId e twitchUsername são obrigatórios",
        400,
        "VALIDATION_ERROR"
      );
    }

    const streamer = await upsertStreamerFromTwitch({
      id: twitchId,
      twitchId,
      name: String(body.name ?? twitchUsername),
      twitchUsername,
      avatar: body.avatar ?? undefined,
      bio: body.bio ?? undefined,
      twitchUrl:
        body.twitchUrl ?? `https://twitch.tv/${twitchUsername.toLowerCase()}`,
      followers: body.followers ?? undefined,
    });

    if (!streamer) {
      return jsonError("Falha ao sincronizar streamer", 500, "INTERNAL_ERROR");
    }

    const payload: StreamerSyncResponse = {
      id: streamer.id,
      partner: streamer.partner,
      premium: streamer.premium,
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao sincronizar streamer");
  }
}
