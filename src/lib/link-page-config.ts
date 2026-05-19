import {
  LINK_PAGE_CONFIG_VERSION,
  type LinkBlockType,
  type LinkPageBlock,
  type LinkPageConfig,
  type LinkPageTemplateId,
  type LinkPageTheme,
} from "@/types/link-page";
import {
  getTemplateTheme,
  isLinkPageTemplateId,
} from "@/lib/link-page-templates";
import {
  getDefaultNobleLayout,
  sanitizeNobleLayout,
} from "@/lib/link-page-noble";

export function createBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultLinkPageBlocks(): LinkPageBlock[] {
  return [
    {
      id: createBlockId(),
      type: "header",
      visible: true,
      props: { avatarAlign: "center" },
    },
    { id: createBlockId(), type: "bio", visible: false, props: { text: "" } },
    { id: createBlockId(), type: "links", visible: true, props: {} },
    { id: createBlockId(), type: "social", visible: true, props: { style: "icons" } },
    { id: createBlockId(), type: "cta", visible: false, props: { label: "Assistir na Twitch", url: "" } },
  ];
}

const BLOCK_LABELS: Record<LinkBlockType, string> = {
  header: "Cabeçalho",
  bio: "Bio / Tagline",
  links: "Links principais",
  social: "Redes sociais",
  cta: "Botão CTA",
  banner: "Banner",
  about: "Sobre",
  divider: "Divisor",
  donate: "Doações",
  "embed-twitch": "Embed Twitch",
  "embed-youtube": "Embed YouTube",
  schedule: "Agenda",
  games: "Jogos",
};

export function getBlockLabel(type: LinkBlockType): string {
  return BLOCK_LABELS[type] ?? type;
}

export function parseLinkPageConfig(raw: string | null | undefined): LinkPageConfig | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LinkPageConfig>;
    if (parsed?.version !== LINK_PAGE_CONFIG_VERSION) return null;
    if (!parsed.theme || !Array.isArray(parsed.blocks)) return null;
    return sanitizeLinkPageConfig(parsed as LinkPageConfig);
  } catch {
    return null;
  }
}

export function sanitizeLinkPageConfig(
  input: Partial<LinkPageConfig>
): LinkPageConfig {
  const templateId = isLinkPageTemplateId(input.theme?.templateId)
    ? input.theme.templateId
    : "cyberpunk";

  const defaults = createConfigFromTemplate(templateId);

  const theme: LinkPageTheme = {
    ...defaults.theme,
    ...input.theme,
    templateId,
    glowIntensity: clamp(
      Number(input.theme?.glowIntensity ?? defaults.theme.glowIntensity),
      0,
      100
    ),
    blurIntensity: clamp(
      Number(input.theme?.blurIntensity ?? defaults.theme.blurIntensity),
      0,
      100
    ),
    cardRadius: clamp(
      Number(input.theme?.cardRadius ?? defaults.theme.cardRadius),
      0,
      32
    ),
  };

  const blocks =
    input.blocks?.length && input.blocks.every((b) => b?.id && b?.type)
      ? input.blocks.map((b) => {
          const rawProps =
            b.props && typeof b.props === "object"
              ? (b.props as LinkPageBlock["props"])
              : {};
          const props =
            b.type === "header"
              ? sanitizeHeaderBlockProps(rawProps)
              : rawProps;
          return {
            id: String(b.id),
            type: b.type as LinkBlockType,
            visible: b.visible !== false,
            props,
          };
        })
      : defaults.blocks;

  let nobleLayout;
  try {
    nobleLayout =
      theme.templateId === "noble"
        ? sanitizeNobleLayout(input.nobleLayout)
        : undefined;
  } catch {
    nobleLayout =
      theme.templateId === "noble" ? getDefaultNobleLayout() : undefined;
  }

  return {
    version: LINK_PAGE_CONFIG_VERSION,
    theme,
    blocks,
    pageTitle: input.pageTitle?.trim() || undefined,
    pageSubtitle: input.pageSubtitle?.trim() || undefined,
    ...(nobleLayout ? { nobleLayout } : {}),
  };
}

function sanitizeHeaderBlockProps(
  props: LinkPageBlock["props"]
): LinkPageBlock["props"] {
  const align = String(props.avatarAlign ?? "center");
  const avatarAlign =
    align === "left" || align === "right" || align === "center"
      ? align
      : "center";
  return { ...props, avatarAlign };
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function createNobleDefaultBlocks(): LinkPageBlock[] {
  return [
    { id: createBlockId(), type: "bio", visible: false, props: { text: "" } },
  ];
}

export function createConfigFromTemplate(
  templateId: LinkPageTemplateId = "cyberpunk"
): LinkPageConfig {
  const isNoble = templateId === "noble";
  return {
    version: 1,
    theme: getTemplateTheme(templateId),
    blocks: isNoble ? createNobleDefaultBlocks() : createDefaultLinkPageBlocks(),
    pageSubtitle: isNoble ? "FAZENDO HISTÓRIA NOS GAMES" : "Links e redes sociais",
    ...(isNoble ? { nobleLayout: getDefaultNobleLayout() } : {}),
  };
}

export function getDefaultLinkPageConfig(): LinkPageConfig {
  return createConfigFromTemplate("cyberpunk");
}

export function resolveLinkPageConfig(
  stored: LinkPageConfig | null | undefined
): LinkPageConfig {
  if (stored) return sanitizeLinkPageConfig(stored);
  return getDefaultLinkPageConfig();
}

const BLOCK_DEFAULT_PROPS: Partial<
  Record<LinkBlockType, LinkPageBlock["props"]>
> = {
  bio: { text: "" },
  cta: { label: "Assistir na Twitch", url: "" },
  banner: { imageUrl: "" },
  about: { text: "" },
  donate: { label: "Apoiar", url: "" },
  "embed-twitch": { channel: "" },
  "embed-youtube": { videoId: "" },
  social: { style: "icons" },
};

export function createBlockOfType(type: LinkBlockType): LinkPageBlock {
  return {
    id: createBlockId(),
    type,
    visible: true,
    props: { ...(BLOCK_DEFAULT_PROPS[type] ?? {}) },
  };
}

export const ADDABLE_BLOCK_TYPES: LinkBlockType[] = [
  "header",
  "bio",
  "links",
  "social",
  "cta",
  "banner",
  "about",
  "divider",
  "donate",
  "embed-twitch",
  "embed-youtube",
  "schedule",
  "games",
];
