"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { getStreamerSocialLinks } from "@/lib/streamer-social";

export default function StreamerLinksPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [streamer, setStreamer] = useState<{
    name: string;
    twitchUsername: string;
    avatar: string;
    bio: string;
    twitchUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      router.push("/");
      return;
    }

    const fetchStreamer = async () => {
      setLoading(true);
      try {
        const tokenRes = await fetch(
          `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
          { method: "POST" }
        );
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const userRes = await fetch(
          `https://api.twitch.tv/helix/users?login=${encodeURIComponent(slug)}`,
          {
            headers: {
              "Client-ID": clientId,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const userData = await userRes.json();
        const apiUser = userData.data?.[0];
        if (!apiUser) {
          router.push("/");
          return;
        }

        setStreamer({
          name: apiUser.display_name || apiUser.login,
          twitchUsername: apiUser.login,
          avatar: apiUser.profile_image_url,
          bio: apiUser.description || "",
          twitchUrl: `https://twitch.tv/${apiUser.login}`,
        });
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchStreamer();
  }, [slug, router]);

  const links =
    streamer?.twitchUrl && streamer.bio !== undefined
      ? getStreamerSocialLinks(streamer.bio, streamer.twitchUrl)
      : [];

  return (
    <div className="relative z-10 min-h-screen">
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

      <main className="container-cinematic py-10">
        {loading ? (
          <div className="mx-auto max-w-md space-y-4">
            <Skeleton className="mx-auto h-20 w-20 rounded-lg" />
            <Skeleton className="mx-auto h-8 w-48" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : streamer ? (
          <div className="mx-auto max-w-md text-center">
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-lg border-2 border-primary/40 shadow-glow-purple">
              <Image
                src={streamer.avatar}
                alt={streamer.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <h1 className="mb-1 font-headline text-headline-lg text-foreground">
              {streamer.name}
            </h1>
            <p className="mb-8 text-body-sm text-muted-foreground">
              Links e redes sociais
            </p>

            <ul className="flex flex-col gap-3">
              {links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="streamer-linktree-item flex w-full items-center justify-between gap-3 rounded-md px-5 py-4 text-body-md font-medium text-foreground transition-colors duration-200 hover:text-primary"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </main>
    </div>
  );
}
