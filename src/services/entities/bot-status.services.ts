import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface BotStatusResponse {
  botActive: boolean;
  botServiceStatus: "online" | "offline" | "degraded";
  channelConnectionStatus: "online" | "offline" | "reconnecting";
  lastSyncAt: string | null;
  configVersion: number;
  summary: {
    activeCommands: number;
    activeTimers: number;
    blacklistTerms: number;
  };
  message?: string;
}

export const botStatus = {
  get: async (): Promise<BotStatusResponse> => {
    const response = await httpClient.get<BotStatusResponse>(
      ENDPOINTS.Internal.Bot.Status
    );
    return response.data;
  },
};
