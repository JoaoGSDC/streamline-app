import { getStreamerByUsername } from "@lib/db-queries";
import { handleRouteError, jsonSuccess } from "@api/shared/api-response";

export interface PublicStreamerFlagsResponse {
  partner: boolean;
  premium: boolean;
}

export async function getPublicStreamerFlagsController(username: string) {
  try {
    const streamer = await getStreamerByUsername(username.trim().toLowerCase());

    if (!streamer) {
      const emptyPayload: PublicStreamerFlagsResponse = {
        partner: false,
        premium: false,
      };
      return jsonSuccess(emptyPayload);
    }

    const payload: PublicStreamerFlagsResponse = {
      partner: streamer.partner,
      premium: streamer.premium,
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar dados do streamer");
  }
}
