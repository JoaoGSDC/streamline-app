"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, Radio, Star, Twitch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeaturedCreator } from "@/types/landing";

interface FeaturedCreatorCardProps {
  creator: FeaturedCreator;
  variant: "partner" | "premium";
  className?: string;
}

export function FeaturedCreatorCard({
  creator,
  variant,
  className,
}: FeaturedCreatorCardProps) {
  const isPartner = variant === "partner";
  const profileHref = `/${creator.twitchUsername}`;
  const liveHref = creator.twitchUrl || `https://twitch.tv/${creator.twitchUsername}`;
  const description =
    creator.bio?.trim() ||
    (creator.isLive && creator.gameName
      ? `Ao vivo jogando ${creator.gameName}`
      : "Criador na Streamline");

  return (
    <article
      className={cn(
        "landing-creator-card group",
        isPartner ? "landing-creator-card--partner" : "landing-creator-card--premium",
        creator.isLive && "landing-creator-card--live",
        className
      )}
    >
      <div className="landing-creator-card__banner" aria-hidden>
        {creator.avatar ? (
          <Image
            src={creator.avatar}
            alt=""
            fill
            className="object-cover opacity-40 blur-sm scale-110"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : null}
        <div className="landing-creator-card__banner-overlay" />
      </div>

      <div className="landing-creator-card__body">
        <div className="flex items-start justify-between gap-3">
          <div className="relative shrink-0">
            <div
              className={cn(
                "landing-creator-card__avatar-wrap",
                isPartner && "landing-creator-card__avatar-wrap--partner"
              )}
            >
              {creator.avatar ? (
                <Image
                  src={creator.avatar}
                  alt={creator.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-2xl font-bold text-muted-foreground">
                  {creator.name.charAt(0)}
                </div>
              )}
            </div>
            {creator.isLive ? (
              <span
                className="landing-creator-card__live-dot"
                title="Ao vivo"
                aria-label="Ao vivo"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              <h3 className="font-headline text-body-md font-bold leading-tight text-foreground sm:text-body-lg">
                {creator.name}
              </h3>
              {isPartner ? (
                <span className="partner-badge">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  Partner
                </span>
              ) : (
                <span className="premium-badge">
                  <Crown className="h-3 w-3 fill-current" aria-hidden />
                  Premium
                </span>
              )}
            </div>
            <p className="text-caption text-muted-foreground">
              @{creator.twitchUsername}
            </p>
          </div>
        </div>

        {creator.isLive && creator.gameName ? (
          <p className="landing-creator-card__category">
            <Radio className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--status-online))]" />
            <span className="truncate">{creator.gameName}</span>
          </p>
        ) : null}

        <p className="line-clamp-2 text-body-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="landing-creator-card__actions mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          <Button size="sm" className="h-10 w-full sm:w-auto sm:flex-1" asChild>
            <Link href={profileHref}>Ver perfil</Link>
          </Button>
          {creator.isLive ? (
            <Button
              size="sm"
              variant="outline"
              className="h-10 w-full border-primary/30 sm:w-auto"
              asChild
            >
              <a href={liveHref} target="_blank" rel="noopener noreferrer">
                <Twitch className="mr-1.5 h-3.5 w-3.5" />
                Assistir live
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
