"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, Share2, Star, Twitch, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface StreamerHeaderProps {
  id: string;
  name: string;
  twitchUsername: string;
  avatar: string;
  bio: string;
  twitchUrl: string;
  followers?: string;
  /** Parceiro Streamline (benefícios premium + extras) */
  partner?: boolean;
  /** Assinatura premium */
  premium?: boolean;
  loading?: boolean;
  /** TabsList de Agenda/Jogos — card direito, layout vertical */
  navigation?: React.ReactNode;
}

function StreamerHeroSkeleton({ withNav }: { withNav: boolean }) {
  return (
    <section className="mb-0 space-y-0" aria-busy="true" aria-label="Carregando perfil">
      <Skeleton className="h-[200px] w-full rounded-lg sm:h-[220px]" />
      <div className="streamer-divider" />
      <div className="grid grid-cols-1 gap-4 py-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="min-h-[200px]" />
        {withNav && <Skeleton className="min-h-[200px]" />}
      </div>
    </section>
  );
}

function AboutCard({ bio, followers }: { bio: string; followers?: string }) {
  const displayBio =
    bio?.trim() ||
    "Este streamer ainda não adicionou uma descrição ao perfil na Twitch.";

  return (
    <article className="streamer-profile-card flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center gap-2">
        <UserRound className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="font-headline text-body-lg font-bold text-foreground sm:text-headline-lg-mobile">
          Sobre
        </h2>
      </div>
      <p className="min-h-[100px] whitespace-pre-wrap text-body-sm leading-relaxed text-muted-foreground sm:text-body-md">
        {displayBio}
      </p>
      {followers && (
        <p className="mt-4 text-body-sm text-muted-foreground">
          <span className="text-stats-number text-secondary-container">
            {followers}
          </span>{" "}
          seguidores
        </p>
      )}
    </article>
  );
}

function NavigationCard({ children }: { children: React.ReactNode }) {
  return (
    <article className="streamer-profile-card flex h-full min-h-0 flex-col p-0">
      <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
    </article>
  );
}

export const StreamerHeader = ({
  name,
  twitchUsername,
  avatar,
  bio,
  twitchUrl,
  followers,
  partner = false,
  premium = false,
  loading = false,
  navigation,
}: StreamerHeaderProps) => {
  if (loading) {
    return <StreamerHeroSkeleton withNav={!!navigation} />;
  }

  const openTwitch = () =>
    window.open(twitchUrl, "_blank", "noopener,noreferrer");

  return (
    <section className="mb-0">
      <div className="streamer-hero-panel relative overflow-hidden rounded-lg">
        <Image
          src={avatar}
          alt=""
          fill
          className="scale-105 object-cover object-center blur-md brightness-[0.25] saturate-125"
          priority
          sizes="100vw"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-primary-container/15"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-8">
          <div className="relative mx-auto shrink-0 lg:mx-0">
            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-lg border-2 border-primary/50 shadow-glow-purple">
              <Image
                src={avatar}
                alt={name}
                fill
                className="object-cover"
                sizes="160px"
                priority
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center lg:text-left">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <h1 className="font-headline text-headline-lg text-foreground sm:text-display-md">
                {name}
              </h1>
              {premium && !partner && (
                <span className="premium-badge">
                  <Crown className="h-3 w-3 fill-current" aria-hidden />
                  Premium
                </span>
              )}
              {partner && (
                <span className="partner-badge">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  Partner
                </span>
              )}
            </div>

            <Link
              href={`/${twitchUsername}/links`}
              className="streamer-social-link inline-flex items-center gap-1.5 transition-[color,filter] duration-200"
            >
              <Share2 className="h-4 w-4 shrink-0" aria-hidden />
              Acessar redes sociais
            </Link>
          </div>

          <div className="flex w-full shrink-0 justify-center lg:w-auto lg:justify-end">
            <Button
              size="lg"
              className="streamer-cta-twitch w-full min-w-[200px] sm:w-auto lg:min-w-[220px]"
              onClick={openTwitch}
            >
              <Twitch className="mr-2 h-5 w-5 shrink-0" />
              Assista na Twitch
            </Button>
          </div>
        </div>
      </div>

      <div className="streamer-divider" />

      <div className="streamer-cards-grid grid grid-cols-1 gap-4 py-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <AboutCard bio={bio} followers={followers} />
        {navigation && <NavigationCard>{navigation}</NavigationCard>}
      </div>
    </section>
  );
};
