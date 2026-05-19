import type { CSSProperties } from "react";
import type { LinkPageConfig } from "@/types/link-page";

export function useLinkPageThemeStyle(config: LinkPageConfig) {
  const { theme } = config;
  const glow = theme.glowIntensity / 100;
  const blur = theme.blurIntensity;

  const style: CSSProperties = {
    "--lp-primary": theme.primaryColor,
    "--lp-accent": theme.accentColor,
    "--lp-glow": String(glow),
    "--lp-blur": `${blur}px`,
    "--lp-radius": `${theme.cardRadius}px`,
    "--lp-text-align": theme.alignment,
  } as CSSProperties;

  const backgroundStyle: CSSProperties = {};
  if (theme.backgroundType === "image" && theme.backgroundValue) {
    backgroundStyle.backgroundImage = `url(${theme.backgroundValue})`;
    backgroundStyle.backgroundSize = "cover";
    backgroundStyle.backgroundPosition = "center";
  } else if (
    theme.backgroundType === "gradient" ||
    theme.backgroundType === "solid"
  ) {
    backgroundStyle.background = theme.backgroundValue;
  } else {
    backgroundStyle.background = theme.backgroundValue;
  }

  const rootClass = [
    "link-page",
    `link-page--${theme.templateId}`,
    `link-page--card-${theme.cardStyle}`,
    `link-page--spacing-${theme.spacing}`,
    theme.backgroundType === "particles" && "link-page--particles",
  ]
    .filter(Boolean)
    .join(" ");

  return { style, backgroundStyle, rootClass };
}
