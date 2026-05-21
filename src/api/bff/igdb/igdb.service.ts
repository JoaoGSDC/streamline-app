import { igdbServerService } from "@server/igdb/igdb.service";
import type { IgdbGameDetailsDto, IgdbSearchResultDto } from "./igdb.types";

export const igdbBffService = {
  searchGames: async (
    query: string,
    limit: number
  ): Promise<IgdbSearchResultDto[]> => {
    return igdbServerService.searchGames(query, limit);
  },

  getGameDetails: async (gameId: number): Promise<IgdbGameDetailsDto | null> => {
    return igdbServerService.getGameDetails(gameId);
  },
};
