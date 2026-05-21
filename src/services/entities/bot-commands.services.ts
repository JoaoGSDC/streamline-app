import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface BotCommandRecord {
  id: string;
  streamerId: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
  updatedAt: string | Date;
  createdAt?: string | Date;
  configVersion?: number;
}

export interface BotCommandsListResponse {
  items: BotCommandRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBotCommandPayload {
  trigger: string;
  response: string;
  cooldownSeconds?: number;
  enabled?: boolean;
}

export const botCommands = {
  list: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BotCommandsListResponse> => {
    const response = await httpClient.get<BotCommandsListResponse>(
      ENDPOINTS.Internal.Bot.Commands,
      { params }
    );
    return (
      response.data ?? {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
      }
    );
  },

  getById: async (id: string): Promise<BotCommandRecord> => {
    const response = await httpClient.get<BotCommandRecord>(
      ENDPOINTS.Internal.Bot.CommandById(id)
    );
    return response.data;
  },

  create: async (
    payload: CreateBotCommandPayload
  ): Promise<BotCommandRecord> => {
    const response = await httpClient.post<BotCommandRecord>(
      ENDPOINTS.Internal.Bot.Commands,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<CreateBotCommandPayload>
  ): Promise<BotCommandRecord> => {
    const response = await httpClient.patch<BotCommandRecord>(
      ENDPOINTS.Internal.Bot.CommandById(id),
      payload
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Bot.CommandById(id));
  },
};
