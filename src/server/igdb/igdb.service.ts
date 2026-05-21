import { igdbGateway } from "./igdb.gateway";
import type { IgdbGameDetailsDto, IgdbSearchResultDto } from "./igdb.types";

export const igdbServerService = {
  searchGames: async (
    query: string,
    limit: number
  ): Promise<IgdbSearchResultDto[]> => {
    return igdbGateway.searchGames(query, limit);
  },

  getGameDetails: async (gameId: number): Promise<IgdbGameDetailsDto | null> => {
    return igdbGateway.getGameDetails(gameId);
  },
};
