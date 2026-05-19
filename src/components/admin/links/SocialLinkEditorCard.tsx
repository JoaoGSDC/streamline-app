"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import {
  SOCIAL_PLATFORMS,
  getPlatformById,
  resolveSocialPlatform,
  isValidHttpUrl,
  type SocialPlatformId,
} from "./social-platform";
import { ColorPickerField } from "@/components/admin/shared/ColorPickerField";

interface SocialLinkEditorCardProps {
  link: StreamerSocialLink;
  index: number;
  onChange: (index: number, patch: Partial<StreamerSocialLink>) => void;
  onRemove: (index: number) => void;
}

export function SocialLinkEditorCard({
  link,
  index,
  onChange,
  onRemove,
}: SocialLinkEditorCardProps) {
  const platform = resolveSocialPlatform(link);
  const Icon = platform.icon;
  const hasUrl = link.url.trim().length > 0;
  const valid = hasUrl && isValidHttpUrl(link.url.trim());
  const selectedId = (link.platformId as SocialPlatformId) || platform.id;

  const handlePlatformChange = (platformId: string) => {
    const meta = getPlatformById(platformId);
    onChange(index, {
      platformId,
      label: link.label.trim() || meta.label,
      iconColor: link.iconColor?.trim() || meta.color,
    });
  };

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

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ícone / rede</Label>
          <Select value={selectedId} onValueChange={handlePlatformChange}>
            <SelectTrigger className="input-cinematic h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_PLATFORMS.map((p) => {
                const PIcon = p.icon;
                return (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <PIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: p.color }}
                        aria-hidden
                      />
                      {p.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <ColorPickerField
          label="Cor do ícone"
          value={link.iconColor ?? platform.color}
          onChange={(iconColor) => onChange(index, { iconColor })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-caption font-medium text-muted-foreground">
            Nome exibido
          </label>
          <Input
            placeholder="Ex.: Instagram"
            value={link.label}
            onChange={(e) => onChange(index, { label: e.target.value })}
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
            onChange={(e) => onChange(index, { url: e.target.value })}
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
