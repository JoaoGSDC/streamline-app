import { NextRequest } from "next/server";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import {
  validateIgdbGameId,
  validateIgdbSearchLimit,
  validateIgdbSearchQuery,
} from "@server/igdb/igdb.validator";
import { igdbBffService } from "./igdb.service";
import type { IgdbGameDetailsResponse, IgdbSearchResponse } from "./igdb.types";

export async function searchIgdbGamesController(request: NextRequest) {
  try {
    const query = validateIgdbSearchQuery(request.nextUrl.searchParams.get("q"));
    const limit = validateIgdbSearchLimit(request.nextUrl.searchParams.get("limit"));

    const results = await igdbBffService.searchGames(query, limit);
    const payload: IgdbSearchResponse = { results };
    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao buscar jogos na IGDB");
  }
}

export async function getIgdbGameDetailsController(gameIdParam: string) {
  try {
    const gameId = validateIgdbGameId(gameIdParam);
    const game = await igdbBffService.getGameDetails(gameId);

    if (!game) {
      return jsonError("Jogo não encontrado", 404, "NOT_FOUND");
    }

    const payload: IgdbGameDetailsResponse = { game };
    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao buscar jogo na IGDB");
  }
}
