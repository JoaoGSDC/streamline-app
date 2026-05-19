import type {
  LinkPageTemplateId,
  LinkPageTheme,
} from "@/types/link-page";

export interface LinkPageTemplateMeta {
  id: LinkPageTemplateId;
  name: string;
  description: string;
  previewClass: string;
}

export const LINK_PAGE_TEMPLATE_IDS = [
  "cyberpunk",
  "tactical",
  "overlay",
  "arcade",
  "minimal",
  "anime",
  "noble",
] as const satisfies readonly LinkPageTemplateId[];

export function isLinkPageTemplateId(
  value: unknown
): value is LinkPageTemplateId {
  return (
    typeof value === "string" &&
    (LINK_PAGE_TEMPLATE_IDS as readonly string[]).includes(value)
  );
}

export const LINK_PAGE_TEMPLATES: LinkPageTemplateMeta[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    description: "Glow forte, neon roxo/cyan e glass intenso",
    previewClass: "link-template-preview--cyberpunk",
  },
  {
    id: "tactical",
    name: "Tactical HUD",
    description: "Painel militar futurista, linhas técnicas",
    previewClass: "link-template-preview--tactical",
  },
  {
    id: "overlay",
    name: "Stream Overlay",
    description: "Cards flutuantes estilo overlay Twitch",
    previewClass: "link-template-preview--overlay",
  },
  {
    id: "arcade",
    name: "Retro Arcade",
    description: "Visual retrô gamer com neon quente",
    previewClass: "link-template-preview--arcade",
  },
  {
    id: "minimal",
    name: "Minimal Creator",
    description: "Clean premium com foco no conteúdo",
    previewClass: "link-template-preview--minimal",
  },
  {
    id: "anime",
    name: "Anime / Geek",
    description: "Estilizado, banners fortes e cards vivos",
    previewClass: "link-template-preview--anime",
  },
  {
    id: "noble",
    name: "Noble Premium",
    description: "Hero cinematográfico, redes no topo e cards de destaque",
    previewClass: "link-template-preview--noble",
  },
];

const TEMPLATE_THEMES: Record<LinkPageTemplateId, Partial<LinkPageTheme>> = {
  cyberpunk: {
    primaryColor: "hsl(270 85% 65%)",
    accentColor: "hsl(185 90% 55%)",
    glowIntensity: 85,
    blurIntensity: 70,
    backgroundType: "gradient",
    backgroundValue:
      "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(270 80% 40% / 0.45), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, hsl(185 90% 40% / 0.2), transparent), hsl(240 20% 6%)",
    cardStyle: "glass",
    cardRadius: 14,
    spacing: "normal",
    alignment: "center",
  },
  tactical: {
    primaryColor: "hsl(145 60% 48%)",
    accentColor: "hsl(48 90% 55%)",
    glowIntensity: 45,
    blurIntensity: 40,
    backgroundType: "solid",
    backgroundValue: "hsl(220 15% 8%)",
    cardStyle: "outline",
    cardRadius: 4,
    spacing: "compact",
    alignment: "left",
  },
  overlay: {
    primaryColor: "hsl(262 70% 58%)",
    accentColor: "hsl(330 75% 58%)",
    glowIntensity: 65,
    blurIntensity: 55,
    backgroundType: "gradient",
    backgroundValue:
      "linear-gradient(160deg, hsl(262 50% 12%) 0%, hsl(240 25% 6%) 50%, hsl(330 40% 10%) 100%)",
    cardStyle: "glass",
    cardRadius: 16,
    spacing: "relaxed",
    alignment: "center",
  },
  arcade: {
    primaryColor: "hsl(330 90% 58%)",
    accentColor: "hsl(48 100% 55%)",
    glowIntensity: 75,
    blurIntensity: 35,
    backgroundType: "particles",
    backgroundValue: "hsl(260 30% 8%)",
    cardStyle: "solid",
    cardRadius: 8,
    spacing: "normal",
    alignment: "center",
  },
  minimal: {
    primaryColor: "hsl(270 50% 62%)",
    accentColor: "hsl(200 60% 55%)",
    glowIntensity: 25,
    blurIntensity: 50,
    backgroundType: "gradient",
    backgroundValue:
      "linear-gradient(180deg, hsl(240 15% 10%) 0%, hsl(240 12% 6%) 100%)",
    cardStyle: "glass",
    cardRadius: 12,
    spacing: "relaxed",
    alignment: "center",
  },
  anime: {
    primaryColor: "hsl(300 75% 62%)",
    accentColor: "hsl(200 85% 58%)",
    glowIntensity: 80,
    blurIntensity: 60,
    backgroundType: "gradient",
    backgroundValue:
      "radial-gradient(circle at 20% 0%, hsl(300 70% 35% / 0.5), transparent 50%), radial-gradient(circle at 80% 100%, hsl(200 80% 35% / 0.35), transparent 45%), hsl(250 25% 7%)",
    cardStyle: "glass",
    cardRadius: 20,
    spacing: "relaxed",
    alignment: "center",
  },
  noble: {
    primaryColor: "#2563ff",
    accentColor: "#d4af37",
    glowIntensity: 55,
    blurIntensity: 45,
    backgroundType: "solid",
    backgroundValue: "#050816",
    cardStyle: "glass",
    cardRadius: 12,
    spacing: "normal",
    alignment: "center",
  },
};

export function getTemplateTheme(
  templateId: LinkPageTemplateId,
  base?: LinkPageTheme
): LinkPageTheme {
  const preset = TEMPLATE_THEMES[templateId];
  return {
    templateId,
    primaryColor: preset.primaryColor ?? base?.primaryColor ?? "hsl(270 85% 65%)",
    accentColor: preset.accentColor ?? base?.accentColor ?? "hsl(185 90% 55%)",
    glowIntensity: preset.glowIntensity ?? base?.glowIntensity ?? 60,
    blurIntensity: preset.blurIntensity ?? base?.blurIntensity ?? 50,
    backgroundType: preset.backgroundType ?? base?.backgroundType ?? "gradient",
    backgroundValue:
      preset.backgroundValue ??
      base?.backgroundValue ??
      "hsl(240 20% 6%)",
    cardStyle: preset.cardStyle ?? base?.cardStyle ?? "glass",
    cardRadius: preset.cardRadius ?? base?.cardRadius ?? 12,
    spacing: preset.spacing ?? base?.spacing ?? "normal",
    alignment: preset.alignment ?? base?.alignment ?? "center",
  };
}

export function applyTemplateTheme(
  current: LinkPageTheme,
  templateId: LinkPageTemplateId
): LinkPageTheme {
  return getTemplateTheme(templateId, current);
}
