import { NextRequest, NextResponse } from "next/server";
import { createGame, getGameById } from "@/lib/db-queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      igdbId,
      title,
      image,
      synopsis,
      genre,
      platform,
      website,
      storeLinks,
      isCustomGame,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const game = await createGame({
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      igdbId,
      title,
      image,
      synopsis,
      genre,
      platform,
      website,
      storeLinks,
      isCustomGame: isCustomGame || false,
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    const game = await getGameById(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
