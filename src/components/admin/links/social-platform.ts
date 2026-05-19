import type { IconType } from "react-icons";
import {
  SiDiscord,
  SiGithub,
  SiInstagram,
  SiKick,
  SiSpotify,
  SiSteam,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { HiGlobeAlt } from "react-icons/hi2";
import type { StreamerSocialLink } from "@/lib/streamer-social";

export type SocialPlatformId =
  | "twitch"
  | "youtube"
  | "kick"
  | "instagram"
  | "discord"
  | "twitter"
  | "tiktok"
  | "steam"
  | "github"
  | "spotify"
  | "other";

export interface SocialPlatformMeta {
  id: SocialPlatformId;
  label: string;
  icon: IconType;
  color: string;
}

const PLATFORM_REGISTRY: SocialPlatformMeta[] = [
  {
    id: "twitch",
    label: "Twitch",
    icon: SiTwitch,
    color: "hsl(var(--twitch))",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    color: "#ff0000",
  },
  { id: "kick", label: "Kick", icon: SiKick, color: "#53fc18" },
  {
    id: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    color: "#e4405f",
  },
  {
    id: "discord",
    label: "Discord",
    icon: SiDiscord,
    color: "#5865f2",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: SiX,
    color: "hsl(var(--foreground))",
  },
  { id: "tiktok", label: "TikTok", icon: SiTiktok, color: "#00f2ea" },
  { id: "steam", label: "Steam", icon: SiSteam, color: "#66c0f4" },
  { id: "github", label: "GitHub", icon: SiGithub, color: "#f0f6fc" },
  { id: "spotify", label: "Spotify", icon: SiSpotify, color: "#1db954" },
  {
    id: "other",
    label: "Outro / Link",
    icon: HiGlobeAlt,
    color: "hsl(var(--muted-foreground))",
  },
];

const PLATFORMS: { match: RegExp; meta: SocialPlatformMeta }[] =
  PLATFORM_REGISTRY.filter((p) => p.id !== "other").map((meta) => ({
    meta,
    match: platformMatchPattern(meta.id),
  }));

function platformMatchPattern(id: SocialPlatformId): RegExp {
  switch (id) {
    case "twitch":
      return /twitch/i;
    case "youtube":
      return /youtube|youtu\.be/i;
    case "kick":
      return /kick\.com/i;
    case "instagram":
      return /instagram/i;
    case "discord":
      return /discord/i;
    case "twitter":
      return /twitter|x\.com/i;
    case "tiktok":
      return /tiktok/i;
    case "steam":
      return /steamcommunity|steampowered|steam\.com/i;
    case "github":
      return /github\.com/i;
    case "spotify":
      return /spotify\.com|open\.spotify/i;
    default:
      return /$^/;
  }
}

export const SOCIAL_PLATFORMS = PLATFORM_REGISTRY;

export function getPlatformById(id: string): SocialPlatformMeta {
  return (
    PLATFORM_REGISTRY.find((p) => p.id === id) ??
    PLATFORM_REGISTRY.find((p) => p.id === "other")!
  );
}

export function detectSocialPlatform(link: StreamerSocialLink): SocialPlatformMeta {
  const haystack = `${link.label} ${link.url}`.toLowerCase();
  for (const { match, meta } of PLATFORMS) {
    if (match.test(haystack)) return meta;
  }
  return getPlatformById("other");
}

/** Plataforma + cor customizada do link */
export function resolveSocialPlatform(link: StreamerSocialLink): SocialPlatformMeta {
  const base = link.platformId
    ? getPlatformById(link.platformId)
    : detectSocialPlatform(link);
  const color = link.iconColor?.trim() || base.color;
  return {
    ...base,
    label: link.label.trim() || base.label,
    color,
  };
}

export function isValidHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
