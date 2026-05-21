import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import { dedupeRequest } from "@services/utils/request-dedupe";
import type { StreamerSocialLink } from "@lib/streamer-social";
import type { LinkPageConfig } from "@/types/link-page";
import type {
  PublicSocialLinksResponse,
  SocialLinksAdminResponse,
} from "@api/internal/streamers/social-links.controller";

export interface UpdateSocialLinksPayload {
  links?: StreamerSocialLink[];
  pageConfig?: LinkPageConfig;
}

export const socialLinks = {
  admin: {
    findByStreamerId: async (
      streamerId: string
    ): Promise<SocialLinksAdminResponse> => {
      return dedupeRequest(`social-links:${streamerId}`, async () => {
        const response = await httpClient.get<SocialLinksAdminResponse>(
          ENDPOINTS.Internal.StreamerSocialLinks(streamerId)
        );
        return response.data;
      });
    },

    update: async (
      streamerId: string,
      payload: UpdateSocialLinksPayload
    ): Promise<SocialLinksAdminResponse> => {
      const response = await httpClient.put<SocialLinksAdminResponse>(
        ENDPOINTS.Internal.StreamerSocialLinks(streamerId),
        payload
      );
      return response.data;
    },
  },

  public: {
    findByUsername: async (username: string): Promise<PublicSocialLinksResponse> => {
      const response = await httpClient.get<PublicSocialLinksResponse>(
        ENDPOINTS.Internal.StreamerPublicSocialLinks(username)
      );
      return response.data;
    },
  },
};
