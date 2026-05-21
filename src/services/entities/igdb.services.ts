import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  IgdbGameDetailsDto,
  IgdbSearchResultDto,
} from "@server/igdb/igdb.types";

interface IgdbSearchResponse {
  results: IgdbSearchResultDto[];
}

interface IgdbGameDetailsResponse {
  game: IgdbGameDetailsDto;
}

export const igdb = {
  games: {
    search: async (
      query: string,
      limit = 10,
      signal?: AbortSignal
    ): Promise<IgdbSearchResultDto[]> => {
      const response = await httpClient.get<IgdbSearchResponse>(
        ENDPOINTS.Bff.Igdb.Search,
        { params: { q: query, limit }, signal }
      );
      return Array.isArray(response.data.results) ? response.data.results : [];
    },

    findById: async (
      gameId: number,
      signal?: AbortSignal
    ): Promise<IgdbGameDetailsDto | null> => {
      const response = await httpClient.get<IgdbGameDetailsResponse>(
        ENDPOINTS.Bff.Igdb.GameById(gameId),
        { signal }
      );
      return response.data.game ?? null;
    },
  },
};
