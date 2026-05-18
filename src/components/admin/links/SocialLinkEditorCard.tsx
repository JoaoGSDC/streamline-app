"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import { detectSocialPlatform, isValidHttpUrl } from "./social-platform";

interface SocialLinkEditorCardProps {
  link: StreamerSocialLink;
  index: number;
  onChange: (index: number, field: keyof StreamerSocialLink, value: string) => void;
  onRemove: (index: number) => void;
}

export function SocialLinkEditorCard({
  link,
  index,
  onChange,
  onRemove,
}: SocialLinkEditorCardProps) {
  const platform = detectSocialPlatform(link);
  const Icon = platform.icon;
  const hasUrl = link.url.trim().length > 0;
  const valid = hasUrl && isValidHttpUrl(link.url.trim());

  return (
    <div
      className={cn(
        "admin-social-link-card",
        valid && "admin-social-link-card--valid"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: `${platform.color}22`,
              color: platform.color,
              boxShadow: valid ? `0 0 16px ${platform.color}33` : undefined,
            }}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-headline text-body-sm font-semibold text-foreground">
              {platform.label}
            </p>
            <p className="text-caption text-muted-foreground">
              {valid
                ? "Link válido"
                : hasUrl
                  ? "URL inválida"
                  : "Aguardando URL"}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {valid && (
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive"
            onClick={() => onRemove(index)}
            aria-label="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-caption font-medium text-muted-foreground">
            Nome exibido
          </label>
          <Input
            placeholder="Ex.: Instagram"
            value={link.label}
            onChange={(e) => onChange(index, "label", e.target.value)}
            className="input-cinematic"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-caption font-medium text-muted-foreground">
            URL
          </label>
          <Input
            type="url"
            placeholder="https://..."
            value={link.url}
            onChange={(e) => onChange(index, "url", e.target.value)}
            className={cn(
              "input-cinematic",
              hasUrl && !valid && "border-destructive/50"
            )}
          />
        </div>
      </div>
    </div>
  );
}
