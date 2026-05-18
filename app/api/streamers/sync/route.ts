import { NextRequest, NextResponse } from "next/server";
import { upsertStreamerFromTwitch } from "@/lib/db-queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const twitchId = String(body.twitchId ?? body.id ?? "").trim();
    const twitchUsername = String(body.twitchUsername ?? body.login ?? "").trim();

    if (!twitchId || !twitchUsername) {
      return NextResponse.json(
        { error: "twitchId e twitchUsername são obrigatórios" },
        { status: 400 }
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
      return NextResponse.json(
        { error: "Falha ao sincronizar streamer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: streamer.id,
      partner: streamer.partner,
      premium: streamer.premium,
    });
  } catch (error) {
    console.error("Streamer sync error:", error);
    return NextResponse.json(
      { error: "Falha ao sincronizar streamer" },
      { status: 500 }
    );
  }
}
