import {
  type LinkPageNobleLayout,
  type NobleAccentTone,
  type NobleFeaturedItem,
  type NobleItemVariant,
  type NobleSocialButtonShape,
  type NobleTextAlign,
} from "@/types/link-page";

export function createNobleItemId(): string {
  return `noble_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const NOBLE_ACCENT_COLORS: Record<
  NobleAccentTone,
  { border: string; glow: string; badge: string }
> = {
  blue: {
    border: "rgba(37, 99, 255, 0.35)",
    glow: "rgba(37, 99, 255, 0.28)",
    badge: "#2563ff",
  },
  purple: {
    border: "rgba(145, 70, 255, 0.35)",
    glow: "rgba(145, 70, 255, 0.3)",
    badge: "#9146FF",
  },
  gold: {
    border: "rgba(212, 175, 55, 0.3)",
    glow: "rgba(212, 175, 55, 0.25)",
    badge: "#d4af37",
  },
};

export function getDefaultNobleLayout(): LinkPageNobleLayout {
  return {
    heroImageUrl: "",
    logoSymbol: "✦",
    heroEyebrow: "Canal oficial na Twitch",
    showSocialButtons: true,
    socialButtonShape: "circle",
    socialButtonBgColor: "rgba(212, 175, 55, 0.15)",
    socialButtonBorderColor: "rgba(212, 175, 55, 0.3)",
    secondaryColor: "#d4af37",
    showFooter: true,
    featuredItems: [
      {
        id: createNobleItemId(),
        visible: true,
        title: "TWITCH",
        subtitle: "LIVE CINEMATOGRÁFICA • AO VIVO",
        url: "",
        imageUrl: "",
        badge: "AO VIVO",
        accent: "purple",
        variant: "featured",
      },
      {
        id: createNobleItemId(),
        visible: true,
        title: "COMUNIDADE",
        subtitle: "Entre no nosso servidor",
        url: "",
        imageUrl: "",
        cta: "FAÇA PARTE",
        accent: "gold",
        variant: "featured",
      },
    ],
  };
}

function sanitizeShape(shape: unknown): NobleSocialButtonShape {
  if (shape === "square" || shape === "rounded") return shape;
  return "circle";
}

function sanitizeVariant(v: unknown): NobleItemVariant {
  return v === "simple" ? "simple" : "featured";
}

function sanitizeAccent(a: unknown): NobleAccentTone {
  if (a === "blue" || a === "purple" || a === "gold") return a;
  return "gold";
}

function sanitizeTextAlign(a: unknown): NobleTextAlign {
  if (a === "left" || a === "right") return a;
  return "center";
}

function sanitizeFeaturedItem(raw: Partial<NobleFeaturedItem>): NobleFeaturedItem {
  return {
    id: String(raw.id || createNobleItemId()),
    visible: raw.visible !== false,
    title: String(raw.title ?? "").trim() || "Destaque",
    subtitle: String(raw.subtitle ?? "").trim(),
    url: String(raw.url ?? "").trim(),
    imageUrl: String(raw.imageUrl ?? "").trim(),
    badge: raw.badge ? String(raw.badge).trim() : undefined,
    accent: sanitizeAccent(raw.accent),
    variant: sanitizeVariant(raw.variant),
    cta: raw.cta ? String(raw.cta).trim() : undefined,
    textAlign: sanitizeTextAlign(raw.textAlign),
  };
}

export function sanitizeNobleLayout(
  input: Partial<LinkPageNobleLayout> | undefined
): LinkPageNobleLayout {
  const defaults = getDefaultNobleLayout();
  if (!input) return defaults;

  const featuredItems =
    Array.isArray(input.featuredItems) && input.featuredItems.length > 0
      ? input.featuredItems.map((item) => sanitizeFeaturedItem(item))
      : defaults.featuredItems;

  return {
    heroImageUrl: String(input.heroImageUrl ?? defaults.heroImageUrl).trim(),
    logoSymbol: String(input.logoSymbol ?? defaults.logoSymbol).trim() || "✦",
    heroEyebrow: String(input.heroEyebrow ?? defaults.heroEyebrow).trim(),
    showSocialButtons: input.showSocialButtons !== false,
    socialButtonShape: sanitizeShape(input.socialButtonShape),
    socialButtonBgColor:
      String(input.socialButtonBgColor ?? defaults.socialButtonBgColor).trim() ||
      defaults.socialButtonBgColor,
    socialButtonBorderColor:
      String(
        input.socialButtonBorderColor ?? defaults.socialButtonBorderColor
      ).trim() || defaults.socialButtonBorderColor,
    secondaryColor:
      String(input.secondaryColor ?? defaults.secondaryColor).trim() ||
      defaults.secondaryColor,
    showFooter: input.showFooter !== false,
    featuredItems,
  };
}

export function createEmptyNobleFeaturedItem(): NobleFeaturedItem {
  return {
    id: createNobleItemId(),
    visible: true,
    title: "Novo destaque",
    subtitle: "",
    url: "",
    imageUrl: "",
    accent: "blue",
    variant: "featured",
    textAlign: "center",
  };
}

export function nobleTextAlignClass(
  align: NobleTextAlign,
  prefix: "noble-simple-btn" | "noble-featured-card__body"
): string {
  return `${prefix}--align-${align}`;
}

/** Estilos inline para garantir alinhamento (evita conflito com flex no CSS) */
export function nobleFeaturedBodyAlignStyle(
  align: NobleTextAlign,
  isHighlight: boolean
): { textAlign: NobleTextAlign; alignItems?: "flex-start" | "center" | "flex-end" } {
  const textAlign = align;
  if (!isHighlight) return { textAlign };
  return {
    textAlign,
    alignItems:
      align === "left"
        ? "flex-start"
        : align === "right"
          ? "flex-end"
          : "center",
  };
}

export function nobleSimpleBtnAlignStyle(align: NobleTextAlign): {
  justifyContent: "flex-start" | "center" | "flex-end";
} {
  return {
    justifyContent:
      align === "left"
        ? "flex-start"
        : align === "right"
          ? "flex-end"
          : "center",
  };
}
