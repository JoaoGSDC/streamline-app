"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveStreamerSocialLinks } from "@/lib/streamer-social";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import type { LinkPageConfig } from "@/types/link-page";
import { getDefaultLinkPageConfig } from "@/lib/link-page-config";
import { LinkPageRenderer } from "@/components/link-page/LinkPageRenderer";
import type { LinkPageStreamer } from "@/components/link-page/LinkPageBlockView";

export default function StreamerLinksPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [streamer, setStreamer] = useState<LinkPageStreamer | null>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<StreamerSocialLink[]>([]);
  const [pageConfig, setPageConfig] = useState<LinkPageConfig>(
    getDefaultLinkPageConfig()
  );

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/streamers/public/${encodeURIComponent(slug)}/social-links`
        );
        const data = await res.json();

        const apiStreamer = data.streamer;
        if (!apiStreamer?.twitchUsername) {
          router.push("/");
          return;
        }

        const twitchUrl =
          apiStreamer.twitchUrl ||
          `https://twitch.tv/${apiStreamer.twitchUsername}`;

        let avatar = apiStreamer.avatar;
        let name = apiStreamer.name;
        let bio = apiStreamer.bio || "";

        const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
        const clientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET || "";

        if (clientId && clientSecret) {
          try {
            const tokenRes = await fetch(
              `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
              { method: "POST" }
            );
            const tokenData = await tokenRes.json();
            const userRes = await fetch(
              `https://api.twitch.tv/helix/users?login=${encodeURIComponent(slug)}`,
              {
                headers: {
                  "Client-ID": clientId,
                  Authorization: `Bearer ${tokenData.access_token}`,
                },
              }
            );
            const userData = await userRes.json();
            const apiUser = userData.data?.[0];
            if (apiUser) {
              avatar = apiUser.profile_image_url || avatar;
              name = apiUser.display_name || name;
              bio = apiUser.description || bio;
            }
          } catch {
            /* usa dados do DB */
          }
        }

        setStreamer({
          name,
          twitchUsername: apiStreamer.twitchUsername,
          avatar,
          bio,
          twitchUrl,
        });

        const customLinks = Array.isArray(data.links) ? data.links : [];
        setLinks(
          resolveStreamerSocialLinks(customLinks, bio, twitchUrl)
        );
        setPageConfig(data.pageConfig ?? getDefaultLinkPageConfig());
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, router]);

  return (
    <div
      className={
        !loading && pageConfig.theme.templateId === "noble"
          ? "relative z-10 min-h-screen bg-[#050816]"
          : "relative z-10 min-h-screen bg-background"
      }
    >
      <Header
        hideLeadingOnMobile
        leading={
          <Button size="sm" variant="outline" className="text-primary" asChild>
            <Link href={`/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao perfil
            </Link>
          </Button>
        }
        trailing={<div className="hidden w-24 md:block" aria-hidden />}
      />

      {loading ? (
        <div className="mx-auto max-w-md space-y-4 px-4 py-10">
          <Skeleton className="mx-auto h-20 w-20 rounded-lg" />
          <Skeleton className="mx-auto h-8 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : streamer ? (
        <LinkPageRenderer
          config={pageConfig}
          streamer={streamer}
          links={links}
          className="min-h-[calc(100vh-4rem)]"
        />
      ) : null}
    </div>
  );
}
