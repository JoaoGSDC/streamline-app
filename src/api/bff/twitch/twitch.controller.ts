import { NextRequest } from "next/server";
import { handleRouteError, jsonSuccess } from "@api/shared/api-response";
import {
  validateSearchLimit,
  validateSearchQuery,
} from "@server/twitch/twitch.validator";
import { twitchBffService } from "./twitch.service";
import type { TwitchChannelSearchResponse } from "./twitch.types";

export async function searchTwitchChannelsController(
  request: NextRequest
) {
  try {
    const query = validateSearchQuery(request.nextUrl.searchParams.get("q"));
    const limit = validateSearchLimit(
      request.nextUrl.searchParams.get("limit"),
      10,
      25
    );

    const results = await twitchBffService.searchChannels(query, limit);
    const payload: TwitchChannelSearchResponse = { results };
    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao buscar canais na Twitch");
  }
}
