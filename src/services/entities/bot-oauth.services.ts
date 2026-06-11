import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export const botOAuth = {
  getAuthorizeUrl: async (): Promise<{ url: string }> => {
    const response = await httpClient.get<{ url: string }>(
      ENDPOINTS.Internal.Bot.OAuthAuthorize
    );
    return response.data;
  },
};
