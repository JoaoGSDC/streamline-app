import { NextResponse } from "next/server";
import {
  listPartnerStreamers,
  listPremiumOnlyStreamers,
} from "@/lib/db-queries";
import { getTwitchLiveByLogins } from "@/lib/twitch-api";

function toPublicStreamer(
  row: Awaited<ReturnType<typeof listPartnerStreamers>>[number],
  live: { isLive: boolean; gameName: string; title: string } | undefined
) {
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

export async function GET() {
  try {
    const [partners, premiumOnly] = await Promise.all([
      listPartnerStreamers(12),
      listPremiumOnlyStreamers(12),
    ]);

    const logins = [...partners, ...premiumOnly].map((s) => s.twitchUsername);
    let liveMap = new Map<string, { isLive: boolean; gameName: string; title: string }>();

    try {
      const twitchLive = await getTwitchLiveByLogins(logins);
      liveMap = twitchLive;
    } catch {
      /* status offline se Twitch falhar */
    }

    return NextResponse.json({
      partners: partners.map((s) =>
        toPublicStreamer(
          s,
          liveMap.get(s.twitchUsername.toLowerCase())
        )
      ),
      premium: premiumOnly.map((s) =>
        toPublicStreamer(
          s,
          liveMap.get(s.twitchUsername.toLowerCase())
        )
      ),
    });
  } catch (error) {
    console.error("GET featured streamers error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar criadores em destaque" },
      { status: 500 }
    );
  }
}
