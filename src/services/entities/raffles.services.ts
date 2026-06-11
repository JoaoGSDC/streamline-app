import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type { RaffleConfig, RaffleMode } from "@/types/raffle";
import type { z } from "zod";
import type { raffleCreateSchema } from "@server/raffles/raffles.validators";

export type RaffleCreateInput = z.infer<typeof raffleCreateSchema>;

export interface RaffleHistoryItem {
  id: string;
  title: string | null;
  mode: RaffleMode;
  status: string;
  entriesCount: number;
  winnerCount: number;
  winners: Array<{ twitchLogin: string; displayName: string }>;
  completedAt: string | null;
  createdAt: string;
}

export const raffles = {
  getActive: async (): Promise<RaffleConfig | null> => {
    const response = await httpClient.get<RaffleConfig | null>(ENDPOINTS.Internal.Raffles.Active);
    return response.data;
  },

  getById: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.get<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleById(id)
    );
    return response.data;
  },

  create: async (payload: RaffleCreateInput): Promise<RaffleConfig> => {
    const response = await httpClient.post<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.Raffles,
      payload
    );
    return response.data;
  },

  update: async (id: string, payload: Partial<RaffleCreateInput>): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleById(id),
      payload
    );
    return response.data;
  },

  start: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleStart(id)
    );
    return response.data;
  },

  pause: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RafflePause(id)
    );
    return response.data;
  },

  resume: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleResume(id)
    );
    return response.data;
  },

  close: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleClose(id)
    );
    return response.data;
  },

  reopen: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleReopen(id)
    );
    return response.data;
  },

  draw: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.post<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleDraw(id)
    );
    return response.data;
  },

  reroll: async (id: string, winnerId: string, reason?: string): Promise<RaffleConfig> => {
    const response = await httpClient.post<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleReroll(id),
      { winnerId, reason }
    );
    return response.data;
  },

  confirmWinner: async (id: string, winnerId: string): Promise<RaffleConfig> => {
    const response = await httpClient.put<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleConfirmWinner(id, winnerId)
    );
    return response.data;
  },

  addEntry: async (
    id: string,
    payload: { twitchLogin: string; displayName?: string; entryCount?: number }
  ): Promise<RaffleConfig> => {
    const response = await httpClient.post<{ raffle: RaffleConfig }>(
      ENDPOINTS.Internal.Raffles.RaffleEntries(id),
      payload
    );
    return response.data.raffle;
  },

  removeEntry: async (id: string, entryId: string): Promise<RaffleConfig> => {
    const response = await httpClient.delete<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleEntryById(id, entryId)
    );
    return response.data;
  },

  cancel: async (id: string): Promise<RaffleConfig> => {
    const response = await httpClient.delete<RaffleConfig>(
      ENDPOINTS.Internal.Raffles.RaffleById(id)
    );
    return response.data;
  },

  getHistory: async (): Promise<RaffleHistoryItem[]> => {
    const response = await httpClient.get<RaffleHistoryItem[]>(
      ENDPOINTS.Internal.Raffles.History
    );
    return response.data;
  },

  exportUrl: (id: string) => ENDPOINTS.Internal.Raffles.RaffleExport(id),
  streamUrl: (id: string) => ENDPOINTS.Internal.Raffles.RaffleStream(id),
};
