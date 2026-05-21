import {
  listPartnerStreamers,
  listPremiumOnlyStreamers,
} from "@lib/db-queries";
import { twitchServerService } from "@server/twitch/twitch.service";
import { handleRouteError, jsonSuccess } from "@api/shared/api-response";
import type { FeaturedCreator } from "@/types/landing";

type StreamerRow =
  | Awaited<ReturnType<typeof listPartnerStreamers>>[number]
  | Awaited<ReturnType<typeof listPremiumOnlyStreamers>>[number];

function toFeaturedCard(
  row: StreamerRow,
  live: { isLive: boolean; gameName: string; title: string } | undefined
): FeaturedCreator {
  return {
    id: row.id,
    name: row.name,
    twitchUsername: row.twitchUsername,
    avatar: row.avatar,
    bio: row.bio,
    twitchUrl: row.twitchUrl,
    partner: row.partner,
    premium: row.premium,
    isLive: live?.isLive ?? false,
    gameName: live?.gameName || null,
    streamTitle: live?.title || null,
  };
}

export type FeaturedStreamersApiResponse = {
  partners: FeaturedCreator[];
  premium: FeaturedCreator[];
};

export async function listFeaturedStreamersController() {
  try {
    const [partners, premiumOnly] = await Promise.all([
      listPartnerStreamers(12),
      listPremiumOnlyStreamers(12),
    ]);

    const logins = [...partners, ...premiumOnly].map((s) => s.twitchUsername);
    let liveMap = new Map<
      string,
      { isLive: boolean; gameName: string; title: string }
    >();

    try {
      liveMap = await twitchServerService.getLiveStatusByLogins(logins);
    } catch {
      /* status offline se Twitch falhar */
    }

    const payload: FeaturedStreamersApiResponse = {
      partners: partners.map((s) =>
        toFeaturedCard(s, liveMap.get(s.twitchUsername.toLowerCase()))
      ),
      premium: premiumOnly.map((s) =>
        toFeaturedCard(s, liveMap.get(s.twitchUsername.toLowerCase()))
      ),
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar criadores em destaque");
  }
}
