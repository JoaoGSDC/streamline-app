import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface BotActivationResponse {
  active: boolean;
  streamerId: string;
  twitchUsername: string;
  botUsername: string;
  createdAt: string | null;
  updatedAt: string | null;
  deactivatedAt: string | null;
}

export const botActivation = {
  get: async (): Promise<BotActivationResponse> => {
    const response = await httpClient.get<BotActivationResponse>(
      ENDPOINTS.Internal.Bot.Activation
    );
    return response.data;
  },

  activate: async (): Promise<BotActivationResponse> => {
    const response = await httpClient.post<BotActivationResponse>(
      ENDPOINTS.Internal.Bot.Activation
    );
    return response.data;
  },

  deactivate: async (): Promise<BotActivationResponse> => {
    const response = await httpClient.delete<BotActivationResponse>(
      ENDPOINTS.Internal.Bot.Activation
    );
    return response.data;
  },
};
