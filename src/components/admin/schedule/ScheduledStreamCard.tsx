"use client";

import { Calendar, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScheduledStreamItem {
  id: string;
  scheduledDate: Date | string;
  scheduledTime: string;
  duration: string;
  gameTitle?: string | null;
  gameImage?: string | null;
  game?: { title?: string; image?: string | null } | null;
}

function normalizeGameImage(raw?: string | null) {
  if (!raw) return null;
  const full = raw.startsWith("//") ? `https:${raw}` : raw;
  let url = full.replace("/t_thumb/", "/t_1080p/");
  if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
  return url;
}

interface ScheduledStreamCardProps {
  stream: ScheduledStreamItem;
  onClick: () => void;
  onDelete: (id: string) => void;
  streamerLabel?: string;
  className?: string;
}

export function ScheduledStreamCard({
  stream,
  onClick,
  onDelete,
  streamerLabel,
  className,
}: ScheduledStreamCardProps) {
  const title = stream.game?.title || stream.gameTitle || "Jogo";
  const img = normalizeGameImage(stream.game?.image || stream.gameImage);
  const dateLabel = new Date(stream.scheduledDate).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn("admin-schedule-card group", className)}
    >
      {img ? (
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-caption font-semibold text-muted-foreground">
          ?
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-headline text-body-md font-semibold text-foreground">
            {title}
          </h3>
          {streamerLabel ? (
            <span className="rounded-md bg-[hsl(var(--neon-purple-glow)/0.2)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              @{streamerLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dateLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {stream.scheduledTime}
            {stream.duration ? ` · ${stream.duration}` : ""}
          </span>
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(stream.id);
        }}
        aria-label="Remover stream"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </article>
  );
}
