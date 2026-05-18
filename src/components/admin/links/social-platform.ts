import {
  Globe,
  Instagram,
  MessageCircle,
  Twitch,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { StreamerSocialLink } from "@/lib/streamer-social";

export type SocialPlatformId =
  | "twitch"
  | "youtube"
  | "kick"
  | "instagram"
  | "discord"
  | "twitter"
  | "tiktok"
  | "other";

export interface SocialPlatformMeta {
  id: SocialPlatformId;
  label: string;
  icon: LucideIcon;
  color: string;
}

const PLATFORMS: { match: RegExp; meta: SocialPlatformMeta }[] = [
  {
    match: /twitch/i,
    meta: {
      id: "twitch",
      label: "Twitch",
      icon: Twitch,
      color: "hsl(var(--twitch))",
    },
  },
  {
    match: /youtube|youtu\.be/i,
    meta: {
      id: "youtube",
      label: "YouTube",
      icon: Youtube,
      color: "#ff0000",
    },
  },
  {
    match: /kick\.com/i,
    meta: { id: "kick", label: "Kick", icon: Globe, color: "#53fc18" },
  },
  {
    match: /instagram/i,
    meta: {
      id: "instagram",
      label: "Instagram",
      icon: Instagram,
      color: "#e4405f",
    },
  },
  {
    match: /discord/i,
    meta: {
      id: "discord",
      label: "Discord",
      icon: MessageCircle,
      color: "#5865f2",
    },
  },
  {
    match: /twitter|x\.com/i,
    meta: {
      id: "twitter",
      label: "X / Twitter",
      icon: Twitter,
      color: "hsl(var(--foreground))",
    },
  },
  {
    match: /tiktok/i,
    meta: { id: "tiktok", label: "TikTok", icon: Globe, color: "#00f2ea" },
  },
];

export function detectSocialPlatform(link: StreamerSocialLink): SocialPlatformMeta {
  const haystack = `${link.label} ${link.url}`.toLowerCase();
  for (const { match, meta } of PLATFORMS) {
    if (match.test(haystack)) return meta;
  }
  return {
    id: "other",
    label: link.label || "Link",
    icon: Globe,
    color: "hsl(var(--muted-foreground))",
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
