import { NextRequest, NextResponse } from "next/server";
import { searchTwitchChannels } from "@/lib/twitch-api";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 25)
      : 10;

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: "Informe ao menos 2 caracteres em 'q'" },
        { status: 400 }
      );
    }

    const results = await searchTwitchChannels(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Twitch channel search error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar canais na Twitch" },
      { status: 500 }
    );
  }
}
