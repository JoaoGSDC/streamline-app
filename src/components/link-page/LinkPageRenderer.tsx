"use client";

import { cn } from "@/lib/utils";
import type { LinkPageConfig } from "@/types/link-page";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import { useLinkPageThemeStyle } from "@/components/link-page/useLinkPageThemeStyle";
import {
  LinkPageBlockView,
  type LinkPageStreamer,
} from "@/components/link-page/LinkPageBlockView";
import { NobleLinkPageLayout } from "@/components/link-page/NobleLinkPageLayout";

interface LinkPageRendererProps {
  config: LinkPageConfig;
  streamer: LinkPageStreamer;
  links: StreamerSocialLink[];
  className?: string;
  preview?: boolean;
}

export function LinkPageRenderer({
  config,
  streamer,
  links,
  className,
  preview = false,
}: LinkPageRendererProps) {
  const { style, backgroundStyle, rootClass } = useLinkPageThemeStyle(config);

  if (config.theme.templateId === "noble") {
    return (
      <NobleLinkPageLayout
        config={config}
        streamer={streamer}
        links={links}
        preview={preview}
        className={className}
      />
    );
  }

  const visibleBlocks = config.blocks.filter((b) => b.visible);

  return (
    <div
      className={cn(rootClass, preview && "link-page--preview", className)}
      style={style}
    >
      <div className="link-page__bg" style={backgroundStyle} aria-hidden>
        <div className="link-page__bg-overlay" />
        {config.theme.backgroundType === "particles" ? (
          <div className="link-page__particles" aria-hidden />
        ) : null}
      </div>

      <div className="link-page__content">
        {visibleBlocks.map((block) => {
          if (
            preview &&
            (block.type === "embed-twitch" || block.type === "embed-youtube")
          ) {
            return (
              <p
                key={block.id}
                className="link-page__preview-hint rounded-md border border-dashed border-outline-variant/40 px-3 py-2 text-caption text-muted-foreground"
              >
                {block.type === "embed-twitch" ? "Embed Twitch" : "Embed YouTube"}{" "}
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
    </div>
  );
}
