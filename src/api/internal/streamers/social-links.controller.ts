import { NextRequest } from "next/server";
import { getStreamerById, getStreamerByUsername, updateStreamerLinkPage } from "@lib/db-queries";
import { resolveStreamerSocialLinks, type StreamerSocialLink } from "@lib/streamer-social";
import { sanitizeLinkPageConfig } from "@lib/link-page-config";
import { assertCanManageStreamer } from "@lib/admin-auth";
import { twitchServerService } from "@server/twitch/twitch.service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { sanitizeSocialLinksPayload } from "./social-links.validator";
import type { LinkPageConfig } from "@/types/link-page";

export interface SocialLinksAdminResponse {
  links: StreamerSocialLink[];
  pageConfig: LinkPageConfig | null | undefined;
}

export interface PublicLinkPageStreamer {
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  bio?: string | null;
  twitchUrl?: string | null;
  partner?: boolean;
  premium?: boolean;
}

export interface PublicSocialLinksResponse {
  links: StreamerSocialLink[];
  pageConfig: LinkPageConfig | null | undefined;
  streamer: PublicLinkPageStreamer | null;
}

export async function getStreamerSocialLinksController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const auth = await assertCanManageStreamer(request, streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    const streamer = await getStreamerById(streamerId);
    if (!streamer) {
      return jsonError("Streamer não encontrado", 404, "NOT_FOUND");
    }

    const payload: SocialLinksAdminResponse = {
      links: streamer.socialLinks ?? [],
      pageConfig: streamer.linkPageConfig,
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar links");
  }
}

export async function updateStreamerSocialLinksController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const auth = await assertCanManageStreamer(request, streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    const body = await request.json();
    const hasLinks = Array.isArray(body?.links);
    const hasPageConfig =
      body?.pageConfig && typeof body.pageConfig === "object";

    if (!hasLinks && !hasPageConfig) {
      return jsonError("Envie links e/ou pageConfig", 400, "VALIDATION_ERROR");
    }

    let sanitizedLinks: StreamerSocialLink[] | undefined;
    if (hasLinks) {
      sanitizedLinks = sanitizeSocialLinksPayload(body.links);
    }

    let pageConfig: LinkPageConfig | undefined;
    if (hasPageConfig) {
      pageConfig = sanitizeLinkPageConfig(body.pageConfig);
    }

    const updatedStreamer = await updateStreamerLinkPage(streamerId, {
      links: sanitizedLinks,
      pageConfig,
    });

    if (!updatedStreamer) {
      return jsonError("Streamer não encontrado", 404, "NOT_FOUND");
    }

    const payload: SocialLinksAdminResponse = {
      links: updatedStreamer.socialLinks ?? [],
      pageConfig: updatedStreamer.linkPageConfig,
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao salvar links");
  }
}

export async function getPublicSocialLinksController(username: string) {
  try {
    const normalizedUsername = username.trim().toLowerCase();
    const streamer = await getStreamerByUsername(normalizedUsername);

    if (!streamer) {
      const emptyPayload: PublicSocialLinksResponse = { links: [], pageConfig: null, streamer: null };
      return jsonSuccess(emptyPayload);
    }

    const twitchUrl =
      streamer.twitchUrl || `https://twitch.tv/${normalizedUsername}`;

    let name = streamer.name;
    let avatar = streamer.avatar;
    let bio = streamer.bio || "";

    try {
      const twitchUser = await twitchServerService.getUserByLogin(normalizedUsername);
      if (twitchUser) {
        avatar = twitchUser.profileImageUrl || avatar;
        name = twitchUser.displayName || name;
        bio = twitchUser.description || bio;
      }
    } catch {
      /* mantém dados do banco */
    }

    const links = resolveStreamerSocialLinks(
      streamer.socialLinks,
      bio,
      twitchUrl
    );

    const payload: PublicSocialLinksResponse = {
      links,
      pageConfig: streamer.linkPageConfig,
      streamer: {
        name,
        twitchUsername: streamer.twitchUsername,
        avatar,
        bio,
        twitchUrl,
        partner: streamer.partner,
        premium: streamer.premium,
      },
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar links");
  }
}
