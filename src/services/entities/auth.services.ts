import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type { AdminChannelDto } from "@api/internal/admin/channels.controller";

interface TwitchAuthorizeResponse {
  url: string;
}

interface AdminChannelsResponse {
  channels: AdminChannelDto[];
  actingAs: AdminChannelDto;
  userId: string;
}

interface SwitchChannelResponse {
  actingAs: AdminChannelDto;
}

interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    name?: string;
    twitchUsername?: string;
    avatar?: string;
  };
}

export const auth = {
  twitch: {
    getAuthorizeUrl: async (): Promise<string> => {
      const response = await httpClient.get<TwitchAuthorizeResponse>(
        ENDPOINTS.Bff.Auth.TwitchAuthorize
      );
      return response.data.url;
    },
  },

  session: {
    get: async (): Promise<SessionResponse> => {
      const response = await httpClient.get<SessionResponse>(
        ENDPOINTS.Internal.Auth.Session
      );
      return response.data;
    },

    logout: async (): Promise<void> => {
      await httpClient.delete(ENDPOINTS.Internal.Auth.Session);
    },
  },

  admin: {
    channels: {
      findAll: async (): Promise<AdminChannelsResponse> => {
        const response = await httpClient.get<AdminChannelsResponse>(
          ENDPOINTS.Internal.AdminChannels
        );
        return response.data;
      },

      switchTo: async (streamerId: string): Promise<AdminChannelDto> => {
        const response = await httpClient.post<SwitchChannelResponse>(
          ENDPOINTS.Internal.AdminChannels,
          { streamerId }
        );
        return response.data.actingAs;
      },
    },
  },
};
