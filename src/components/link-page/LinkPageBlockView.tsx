"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  Gamepad2,
  Heart,
} from "lucide-react";
import type { LinkPageBlock } from "@/types/link-page";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import { resolveSocialPlatform } from "@/components/admin/links/social-platform";
import { cn } from "@/lib/utils";

export interface LinkPageStreamer {
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  bio?: string | null;
  twitchUrl?: string | null;
}

interface LinkPageBlockViewProps {
  block: LinkPageBlock;
  streamer: LinkPageStreamer;
  links: StreamerSocialLink[];
  pageTitle?: string;
  pageSubtitle?: string;
}

export function LinkPageBlockView({
  block,
  streamer,
  links,
  pageTitle,
  pageSubtitle,
}: LinkPageBlockViewProps) {
  if (!block.visible) return null;

  switch (block.type) {
    case "header": {
      const rawAlign = String(block.props.avatarAlign ?? "center");
      const avatarAlign =
        rawAlign === "left" || rawAlign === "right" ? rawAlign : "center";
      return (
        <header
          className={cn(
            "link-page__header",
            `link-page__header--avatar-${avatarAlign}`
          )}
        >
          <div
            className={cn(
              "link-page__avatar-wrap",
              `link-page__avatar-wrap--${avatarAlign}`
            )}
          >
            {streamer.avatar ? (
              <Image
                src={streamer.avatar}
                alt={streamer.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <span className="link-page__avatar-fallback">
                {streamer.name.charAt(0)}
              </span>
            )}
          </div>
          <h1 className="link-page__title">
            {pageTitle || streamer.name}
          </h1>
          {pageSubtitle ? (
            <p className="link-page__subtitle">{pageSubtitle}</p>
          ) : null}
        </header>
      );
    }

    case "bio": {
      const text = String(block.props.text ?? "").trim();
      if (!text) return null;
      return <p className="link-page__bio">{text}</p>;
    }

    case "links":
      if (links.length === 0) return null;
      return (
        <ul className="link-page__links" role="list">
          {links.map((link) => {
            const platform = resolveSocialPlatform(link);
            const Icon = platform.icon;
            return (
              <li key={`${link.url}-${link.label}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-page__link-card"
                  style={
                    {
                      "--link-platform-color": platform.color,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="link-page__link-icon"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" style={{ color: platform.color }} />
                  </span>
                  <span className="link-page__link-label">{link.label}</span>
                  <ExternalLink className="link-page__link-arrow h-4 w-4 shrink-0" />
                </a>
              </li>
            );
          })}
        </ul>
      );

    case "social":
      if (links.length === 0) return null;
      return (
        <div className="link-page__social-row" role="list">
          {links.map((link) => {
            const platform = resolveSocialPlatform(link);
            const Icon = platform.icon;
            return (
              <a
                key={`${link.url}-social`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-page__social-icon"
                style={
                  {
                    "--link-platform-color": platform.color,
                  } as React.CSSProperties
                }
                aria-label={link.label}
                title={link.label}
              >
                <Icon className="h-5 w-5" style={{ color: platform.color }} />
              </a>
            );
          })}
        </div>
      );

    case "cta": {
      const label = String(block.props.label ?? "Acessar");
      const url = String(block.props.url ?? streamer.twitchUrl ?? "").trim();
      if (!url) return null;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-page__cta"
        >
          {label}
        </a>
      );
    }

    case "banner": {
      const src = String(block.props.imageUrl ?? "").trim();
      if (!src) return null;
      return (
        <div className="link-page__banner">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 420px"
          />
        </div>
      );
    }

    case "about": {
      const text = String(block.props.text ?? streamer.bio ?? "").trim();
      if (!text) return null;
      return (
        <div className="link-page__about glass-panel">
          <h2 className="link-page__about-title">Sobre</h2>
          <p>{text}</p>
        </div>
      );
    }

    case "divider":
      return <hr className="link-page__divider" />;

    case "donate": {
      const url = String(block.props.url ?? "").trim();
      const label = String(block.props.label ?? "Apoiar");
      if (!url) return null;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-page__donate"
        >
          <Heart className="mr-2 h-4 w-4" />
          {label}
        </a>
      );
    }

    case "embed-twitch": {
      const channel =
        String(block.props.channel ?? streamer.twitchUsername).trim();
      return (
        <div className="link-page__embed">
          <iframe
            src={`https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}&muted=true`}
            height="200"
            width="100%"
            allowFullScreen
            title="Twitch"
            className="rounded-lg border border-outline-variant/30"
          />
        </div>
      );
    }

    case "embed-youtube": {
      const videoId = String(block.props.videoId ?? "").trim();
      if (!videoId) return null;
      return (
        <div className="link-page__embed">
          <iframe
            src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`}
            height="200"
            width="100%"
            allowFullScreen
            title="YouTube"
            className="rounded-lg border border-outline-variant/30"
          />
        </div>
      );
    }

    case "schedule":
      return (
        <Link
          href={`/${streamer.twitchUsername}`}
          className="link-page__feature-card"
        >
          <Calendar className="h-5 w-5 text-[var(--lp-accent)]" />
          <span>Ver agenda de streams</span>
          <ExternalLink className="ml-auto h-4 w-4 opacity-50" />
        </Link>
      );

    case "games":
      return (
        <Link
          href={`/${streamer.twitchUsername}/games`}
          className="link-page__feature-card"
        >
          <Gamepad2 className="h-5 w-5 text-[var(--lp-accent)]" />
          <span>Board de jogos</span>
          <ExternalLink className="ml-auto h-4 w-4 opacity-50" />
        </Link>
      );

    default:
      return null;
  }
}
