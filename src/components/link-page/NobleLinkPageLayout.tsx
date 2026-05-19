"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LinkBlockType,
  LinkPageConfig,
  NobleFeaturedItem,
} from "@/types/link-page";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import { NOBLE_ACCENT_COLORS, sanitizeNobleLayout } from "@/lib/link-page-noble";
import { resolveSocialPlatform } from "@/components/admin/links/social-platform";
import {
  LinkPageBlockView,
  type LinkPageStreamer,
} from "@/components/link-page/LinkPageBlockView";

interface NobleLinkPageLayoutProps {
  config: LinkPageConfig;
  streamer: LinkPageStreamer;
  links: StreamerSocialLink[];
  preview?: boolean;
  className?: string;
}

const SHAPE_CLASS = {
  circle: "noble-social-btn--circle",
  square: "noble-social-btn--square",
  rounded: "noble-social-btn--rounded",
} as const;

/** Blocos convencionais substituídos pelo layout Noble */
const NOBLE_EXCLUDED_BLOCKS: LinkBlockType[] = ["header", "social", "links"];

function NobleBackground() {
  return (
    <div className="noble-page__fx" aria-hidden>
      <div className="noble-page__fx-gradient" />
      <div className="noble-page__fx-glow noble-page__fx-glow--blue" />
      <div className="noble-page__fx-glow noble-page__fx-glow--gold" />
      <div className="noble-page__fx-grid" />
    </div>
  );
}

function NobleHero({
  heroImageUrl,
  fallbackImage,
  logoSymbol,
  title,
  subtitle,
  eyebrow,
  secondaryColor,
  primaryColor,
  showSocial,
  socialShape,
  socialBg,
  socialBorder,
  links,
}: {
  heroImageUrl: string;
  fallbackImage?: string | null;
  logoSymbol: string;
  title: string;
  subtitle?: string;
  eyebrow: string;
  secondaryColor: string;
  primaryColor: string;
  showSocial: boolean;
  socialShape: keyof typeof SHAPE_CLASS;
  socialBg: string;
  socialBorder: string;
  links: StreamerSocialLink[];
}) {
  const bgSrc = heroImageUrl.trim() || fallbackImage || "";

  return (
    <header className="noble-hero">
      <div className="noble-hero__media">
        {bgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgSrc} alt="" className="noble-hero__img" />
        ) : (
          <div
            className="noble-hero__img noble-hero__img--placeholder"
            style={{
              background: `linear-gradient(160deg, ${primaryColor}33, #050816)`,
            }}
          />
        )}
        <div className="noble-hero__overlay noble-hero__overlay--dark" />
        <div className="noble-hero__overlay noble-hero__overlay--bottom" />
        <div
          className="noble-hero__glow"
          style={{
            background: `radial-gradient(ellipse at center bottom, ${primaryColor}40 0%, transparent 60%)`,
          }}
        />
      </div>

      <div className="noble-hero__content">
        <span
          className="noble-hero__symbol"
          style={{
            color: secondaryColor,
            textShadow: `0 0 30px ${secondaryColor}80`,
          }}
        >
          {logoSymbol}
        </span>
        <h1 className="noble-hero__title">{title}</h1>
        <div
          className="noble-hero__divider"
          style={{
            background: `linear-gradient(90deg, transparent, ${secondaryColor}cc, transparent)`,
          }}
        />
        {subtitle ? (
          <p
            className="noble-hero__subtitle"
            style={{
              color: secondaryColor,
              textShadow: `0 2px 15px ${secondaryColor}4d`,
            }}
          >
            {subtitle}
          </p>
        ) : null}
        {eyebrow ? <p className="noble-hero__eyebrow">{eyebrow}</p> : null}
      </div>

      {showSocial && links.length > 0 ? (
        <div className="noble-hero__social-wrap">
          <nav className="noble-hero__social" aria-label="Redes sociais">
            {links.map((link) => {
              const platform = resolveSocialPlatform(link);
              const Icon = platform.icon;
              return (
                <a
                  key={`${link.url}-${link.label}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("noble-social-btn", SHAPE_CLASS[socialShape])}
                  style={{
                    background: socialBg,
                    borderColor: socialBorder,
                  }}
                  title={link.label}
                  aria-label={link.label}
                >
                  <Icon
                    className="h-5 w-5 transition-colors duration-300"
                    style={{ color: link.iconColor?.trim() || platform.color }}
                  />
                </a>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function NobleFeaturedCard({
  item,
  secondaryColor,
  preview,
}: {
  item: NobleFeaturedItem;
  secondaryColor: string;
  preview?: boolean;
}) {
  const url = item.url.trim();
  const href = url || (preview ? "#" : undefined);
  const colors = NOBLE_ACCENT_COLORS[item.accent];
  const hasImage = Boolean(item.imageUrl.trim());

  if (item.variant === "simple") {
    if (!href) {
      return (
        <div
          className="noble-simple-btn noble-featured-card--disabled"
          aria-disabled
        >
          <span className="noble-simple-btn__label">{item.title}</span>
          {item.subtitle ? (
            <span className="noble-simple-btn__sub">{item.subtitle}</span>
          ) : null}
        </div>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="noble-simple-btn"
        onClick={preview && !url ? (e) => e.preventDefault() : undefined}
        style={{
          borderColor: colors.border,
          boxShadow: `0 0 calc(16px * var(--lp-glow)) ${colors.glow}`,
        }}
      >
        <span className="noble-simple-btn__label">{item.title}</span>
        {item.subtitle ? (
          <span className="noble-simple-btn__sub">{item.subtitle}</span>
        ) : null}
        <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-60" />
      </a>
    );
  }

  const ambienceTint =
    item.accent === "purple"
      ? "radial-gradient(120% 80% at 78% 10%, rgba(145,70,255,0.45) 0%, transparent 70%)"
      : item.accent === "gold"
        ? "radial-gradient(120% 90% at 70% 8%, rgba(212,175,55,0.35) 0%, transparent 72%)"
        : "radial-gradient(120% 90% at 70% 8%, rgba(37,99,255,0.5) 0%, transparent 72%)";

  const isHighlight = Boolean(item.cta);
  const cardClass = cn(
    "noble-featured-card group",
    isHighlight && "noble-featured-card--highlight",
    !href && "noble-featured-card--disabled"
  );
  const cardInner = (
    <>
      <div className="noble-featured-card__media">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="noble-featured-card__img"
          />
        ) : (
          <div
            className="noble-featured-card__img noble-featured-card__img--empty"
            style={{
              background: `linear-gradient(135deg, ${colors.badge}55, #030712)`,
            }}
          />
        )}
      </div>
      <div
        className="noble-featured-card__tint"
        style={{ background: ambienceTint }}
      />
      <div className="noble-featured-card__shade" />
      <div
        className="noble-featured-card__border"
        style={{
          borderColor: isHighlight ? `${secondaryColor}40` : colors.border,
          boxShadow: `inset 0 -45px 55px rgba(1, 4, 14, 0.7), inset 0 0 24px ${colors.glow}`,
        }}
      />

      {item.badge ? (
        <span
          className="noble-featured-card__badge"
          style={{
            background: colors.badge,
            boxShadow: `0 8px 20px ${colors.glow}`,
          }}
        >
          {item.badge}
        </span>
      ) : null}

      <div
        className={cn(
          "noble-featured-card__body",
          isHighlight && "noble-featured-card__body--highlight"
        )}
      >
        <h3 className="noble-featured-card__title">{item.title}</h3>
        {item.subtitle ? (
          <p className="noble-featured-card__subtitle">{item.subtitle}</p>
        ) : null}
        {item.cta ? (
          <span
            className="noble-featured-card__cta"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}e6, ${secondaryColor}b3)`,
              boxShadow: `0 4px 15px ${secondaryColor}4d`,
              color: "#000",
            }}
          >
            {item.cta}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        ) : null}
      </div>
    </>
  );

  if (!href) {
    return (
      <div className={cardClass} aria-disabled>
        {cardInner}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClass}
      onClick={preview && !url ? (e) => e.preventDefault() : undefined}
    >
      {cardInner}
    </a>
  );
}

export function NobleLinkPageLayout({
  config,
  streamer,
  links,
  preview = false,
  className,
}: NobleLinkPageLayoutProps) {
  const layout = sanitizeNobleLayout(config.nobleLayout);
  const { theme } = config;
  const title = config.pageTitle?.trim() || streamer.name;
  const subtitle = config.pageSubtitle?.trim();

  const extraBlocks = config.blocks.filter(
    (b) => b.visible && !NOBLE_EXCLUDED_BLOCKS.includes(b.type)
  );

  const visibleFeatured = layout.featuredItems.filter((item) => item.visible);

  return (
    <main
      className={cn(
        "noble-page link-page link-page--noble",
        preview && "link-page--preview",
        className
      )}
      style={
        {
          "--lp-primary": theme.primaryColor,
          "--lp-accent": theme.accentColor,
          "--lp-glow": String(theme.glowIntensity / 100),
          "--noble-secondary": layout.secondaryColor,
          "--noble-bg": theme.backgroundValue || "#050816",
        } as React.CSSProperties
      }
    >
      <NobleBackground />

      <div className="noble-page__inner">
        <NobleHero
          heroImageUrl={layout.heroImageUrl}
          fallbackImage={streamer.avatar}
          logoSymbol={layout.logoSymbol}
          title={title}
          subtitle={subtitle}
          eyebrow={layout.heroEyebrow}
          secondaryColor={layout.secondaryColor}
          primaryColor={theme.primaryColor}
          showSocial={layout.showSocialButtons}
          socialShape={layout.socialButtonShape}
          socialBg={layout.socialButtonBgColor}
          socialBorder={layout.socialButtonBorderColor}
          links={links}
        />

        <div className="noble-page__body">
          {visibleFeatured.length > 0 ? (
            <div className="noble-page__featured">
              {visibleFeatured.map((item) => (
                <NobleFeaturedCard
                  key={item.id}
                  item={item}
                  secondaryColor={layout.secondaryColor}
                  preview={preview}
                />
              ))}
            </div>
          ) : null}

          {extraBlocks.length > 0 ? (
            <div className="noble-page__blocks">
              {extraBlocks.map((block) => {
                if (
                  preview &&
                  (block.type === "embed-twitch" ||
                    block.type === "embed-youtube")
                ) {
                  return (
                    <p
                      key={block.id}
                      className="link-page__preview-hint rounded-md border border-dashed border-outline-variant/40 px-3 py-2 text-caption text-muted-foreground"
                    >
                      {block.type === "embed-twitch"
                        ? "Embed Twitch"
                        : "Embed YouTube"}{" "}
                      — visível na página publicada
                    </p>
                  );
                }
                return (
                  <LinkPageBlockView
                    key={block.id}
                    block={block}
                    streamer={streamer}
                    links={links}
                    pageTitle={config.pageTitle}
                    pageSubtitle={config.pageSubtitle}
                  />
                );
              })}
            </div>
          ) : null}

          {layout.showFooter ? (
            <footer className="noble-page__footer">
              <div
                className="noble-page__footer-line"
                style={{
                  background: `linear-gradient(90deg, transparent, ${layout.secondaryColor}80, transparent)`,
                }}
              />
              <p className="noble-page__footer-copy">
                © {new Date().getFullYear()} {title}
              </p>
              <p className="noble-page__footer-rights">
                Todos os direitos reservados
              </p>
            </footer>
          ) : null}
        </div>
      </div>
    </main>
  );
}

