import { queryIgdbGameById, queryIgdbGamesSearch } from "./igdb.client";
import { mapIgdbGameDetails, mapIgdbSearchResults } from "./igdb.mapper";
import type { IgdbGameDetailsDto, IgdbSearchResultDto } from "./igdb.types";

export const igdbGateway = {
  searchGames: async (
    query: string,
    limit: number
  ): Promise<IgdbSearchResultDto[]> => {
    const games = await queryIgdbGamesSearch(query, limit);
    return mapIgdbSearchResults(games);
  },

  getGameDetails: async (gameId: number): Promise<IgdbGameDetailsDto | null> => {
    const game = await queryIgdbGameById(gameId);
    if (!game) return null;
    return mapIgdbGameDetails(game);
  },
};
