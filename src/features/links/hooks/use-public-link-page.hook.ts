"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveStreamerSocialLinks } from "@lib/streamer-social";
import type { StreamerSocialLink } from "@lib/streamer-social";
import type { LinkPageConfig } from "@/types/link-page";
import { getDefaultLinkPageConfig } from "@lib/link-page-config";
import { services } from "@services";
import type { PublicLinkPageStreamer } from "@features/links/types/links.types";

export function usePublicLinkPage(slug: string | undefined) {
  const router = useRouter();
  const [streamer, setStreamer] = useState<PublicLinkPageStreamer | null>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<StreamerSocialLink[]>([]);
  const [pageConfig, setPageConfig] = useState<LinkPageConfig>(
    getDefaultLinkPageConfig()
  );

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadPublicPage = async () => {
      setLoading(true);
      try {
        const response = await services.socialLinks.public.findByUsername(slug);

        if (cancelled) return;

        const apiStreamer = response.streamer;
        if (!apiStreamer?.twitchUsername) {
          router.push("/");
          return;
        }

        const twitchUrl =
          apiStreamer.twitchUrl ||
          `https://twitch.tv/${apiStreamer.twitchUsername}`;

        setStreamer({
          name: apiStreamer.name,
          twitchUsername: apiStreamer.twitchUsername,
          avatar: apiStreamer.avatar ?? undefined,
          bio: apiStreamer.bio ?? undefined,
          twitchUrl,
        });

        const customLinks = Array.isArray(response.links) ? response.links : [];
        setLinks(
          resolveStreamerSocialLinks(
            customLinks,
            apiStreamer.bio ?? "",
            twitchUrl
          )
        );
        setPageConfig(response.pageConfig ?? getDefaultLinkPageConfig());
      } catch {
        if (!cancelled) router.push("/");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPublicPage();

    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  const isNobleTemplate = pageConfig.theme.templateId === "noble";

  return {
    streamer,
    loading,
    links,
    pageConfig,
    isNobleTemplate,
  };
}
