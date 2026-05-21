import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface GameRecord {
  id: string;
  igdbId?: number | null;
  title: string;
  image?: string | null;
  synopsis?: string | null;
  genre?: string[] | null;
  platform?: string | null;
  website?: string | null;
  storeLinks?: Array<{ name: string; url: string }> | null;
  isCustomGame?: boolean;
}

export interface CreateGamePayload {
  igdbId?: number | null;
  title: string;
  image?: string | null;
  synopsis?: string | null;
  genre?: string[] | null;
  platform?: string | null;
  website?: string | null;
  storeLinks?: Array<{ name: string; url: string }> | null;
  isCustomGame?: boolean;
}

export const games = {
  findOne: async (gameId: string): Promise<GameRecord | null> => {
    const response = await httpClient.get<GameRecord>(ENDPOINTS.Internal.Games, {
      params: { gameId },
    });
    return response.data ?? null;
  },

  create: async (payload: CreateGamePayload): Promise<GameRecord> => {
    const response = await httpClient.post<GameRecord>(
      ENDPOINTS.Internal.Games,
      payload
    );
    return response.data;
  },
};
