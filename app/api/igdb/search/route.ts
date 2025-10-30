import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/igdb";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 50)
      : 10;

    if (!q) {
      return NextResponse.json(
        { error: "Parâmetro 'q' é obrigatório" },
        { status: 400 }
      );
    }

    const results = await searchGames(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("IGDB proxy search error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar jogos na IGDB" },
      { status: 500 }
    );
  }
}
