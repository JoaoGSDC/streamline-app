import { NextRequest } from "next/server";
import { createGame, getGameById } from "@lib/db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function getGameByIdController(request: NextRequest) {
  try {
    const gameId = request.nextUrl.searchParams.get("gameId");
    if (!gameId) {
      return jsonError("gameId is required", 400, "VALIDATION_ERROR");
    }

    const game = await getGameById(gameId);
    if (!game) {
      return jsonError("Game not found", 404, "NOT_FOUND");
    }

    return jsonSuccess(game);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch game");
  }
}

export async function createGameController(request: NextRequest) {
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
      return jsonError("Title is required", 400, "VALIDATION_ERROR");
    }

    const createdGame = await createGame({
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

    return jsonSuccess(createdGame, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create game");
  }
}
