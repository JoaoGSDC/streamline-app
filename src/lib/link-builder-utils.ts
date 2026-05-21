import type { LinkBlockType, LinkPageBackgroundType } from "@/types/link-page";
import type { StreamerSocialLink } from "@/lib/streamer-social";

export const LINK_BLOCKS_WITH_PROPS: LinkBlockType[] = [
  "bio",
  "about",
  "cta",
  "banner",
  "donate",
  "embed-twitch",
  "embed-youtube",
];

export function blockHasPropsEditor(type: LinkBlockType): boolean {
  return LINK_BLOCKS_WITH_PROPS.includes(type);
}

export const BACKGROUND_VALUE_HINTS: Record<LinkPageBackgroundType, string> = {
  gradient:
    "linear-gradient(180deg, hsl(240 20% 10%), hsl(240 15% 4%))",
  solid: "#0a0a12",
  image: "https://exemplo.com/seu-fundo.jpg",
  particles: "#0a0a12",
};

export const BACKGROUND_VALUE_LABELS: Record<LinkPageBackgroundType, string> = {
  gradient: "Cole um CSS gradient",
  solid: "Cor em hex ou hsl",
  image: "URL da imagem de fundo",
  particles: "Cor base (hex/hsl) atrás das partículas",
};

export function createLinkRowId(): string {
  return `lnk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ensureSocialLinkIds(
  links: StreamerSocialLink[]
): StreamerSocialLink[] {
  return links.map((link) => ({
    ...link,
    id: link.id?.trim() || createLinkRowId(),
  }));
}

export const emptySocialLink = (): StreamerSocialLink => ({
  id: createLinkRowId(),
  label: "",
  url: "",
});
