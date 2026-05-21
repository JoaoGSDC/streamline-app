export type LinkPageTemplateId =
  | "cyberpunk"
  | "tactical"
  | "overlay"
  | "arcade"
  | "minimal"
  | "anime"
  | "noble";

/** Forma dos botões de redes sociais no template Noble */
export type NobleSocialButtonShape = "circle" | "square" | "rounded";

/** Destaque com imagem ou botão simples */
export type NobleItemVariant = "featured" | "simple";

export type NobleAccentTone = "blue" | "purple" | "gold";

export type NobleTextAlign = "left" | "center" | "right";

export interface NobleFeaturedItem {
  id: string;
  visible: boolean;
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string;
  badge?: string;
  accent: NobleAccentTone;
  variant: NobleItemVariant;
  /** Texto do CTA interno (cards de destaque) */
  cta?: string;
  /** Alinhamento do título e subtítulo no botão/card */
  textAlign?: NobleTextAlign;
}

/** Layout premium inspirado no modelo Fanton Lord */
export interface LinkPageNobleLayout {
  heroImageUrl: string;
  logoSymbol: string;
  heroEyebrow: string;
  showSocialButtons: boolean;
  socialButtonShape: NobleSocialButtonShape;
  socialButtonBgColor: string;
  socialButtonBorderColor: string;
  featuredItems: NobleFeaturedItem[];
  showFooter: boolean;
  /** Cor dourada / secundária (títulos, bordas) */
  secondaryColor: string;
}

export type LinkPageBackgroundType =
  | "gradient"
  | "image"
  | "solid"
  | "particles";

export type LinkPageCardStyle = "glass" | "solid" | "outline";

export interface LinkPageTheme {
  templateId: LinkPageTemplateId;
  primaryColor: string;
  accentColor: string;
  glowIntensity: number;
  blurIntensity: number;
  backgroundType: LinkPageBackgroundType;
  backgroundValue: string;
  cardStyle: LinkPageCardStyle;
  cardRadius: number;
  spacing: "compact" | "normal" | "relaxed";
  alignment: "left" | "center" | "right";
}

export type LinkBlockType =
  | "header"
  | "bio"
  | "links"
  | "social"
  | "cta"
  | "banner"
  | "about"
  | "divider"
  | "donate"
  | "embed-twitch"
  | "embed-youtube"
  | "schedule"
  | "games";

export interface LinkPageBlock {
  id: string;
  type: LinkBlockType;
  visible: boolean;
  props: Record<string, string | boolean | number>;
}

export interface LinkPageConfig {
  version: 1;
  theme: LinkPageTheme;
  blocks: LinkPageBlock[];
  pageTitle?: string;
  pageSubtitle?: string;
  /** Configuração do template Noble (hero, destaques, redes) */
  nobleLayout?: LinkPageNobleLayout;
}

export const LINK_PAGE_CONFIG_VERSION = 1 as const;
