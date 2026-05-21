import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface BotTimerRecord {
  id: string;
  streamerId: string;
  name: string | null;
  intervalMinutes: number;
  message: string;
  enabled: boolean;
  updatedAt: string | Date;
  configVersion?: number;
}

export interface CreateBotTimerPayload {
  name?: string | null;
  intervalMinutes: number;
  message: string;
  enabled?: boolean;
}

export const botTimers = {
  list: async (): Promise<BotTimerRecord[]> => {
    const response = await httpClient.get<{ items: BotTimerRecord[] }>(
      ENDPOINTS.Internal.Bot.Timers
    );
    return response.data?.items ?? [];
  },

  create: async (payload: CreateBotTimerPayload): Promise<BotTimerRecord> => {
    const response = await httpClient.post<BotTimerRecord>(
      ENDPOINTS.Internal.Bot.Timers,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<CreateBotTimerPayload>
  ): Promise<BotTimerRecord> => {
    const response = await httpClient.patch<BotTimerRecord>(
      ENDPOINTS.Internal.Bot.TimerById(id),
      payload
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Bot.TimerById(id));
  },
};
