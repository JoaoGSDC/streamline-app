"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScheduledStreamItem {
  id: string;
  scheduledDate: Date | string;
  scheduledTime: string;
  duration: string;
  gameTitle?: string | null;
  gameImage?: string | null;
  game?: { title?: string; image?: string | null; synopsis?: string | null } | null;
  links?: Array<{ url: string; name?: string }>;
  notes?: string | null;
}

function formatDateTime(dateValue: Date | string, time: string): string {
  const dateLabel = new Date(dateValue).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${dateLabel} · ${time}`;
}

interface ScheduledStreamCardProps {
  stream: ScheduledStreamItem;
  onEdit: () => void;
  onDelete: (id: string) => void;
  streamerLabel?: string;
  className?: string;
}

export function ScheduledStreamCard({
  stream,
  onEdit,
  onDelete,
  streamerLabel,
  className,
}: ScheduledStreamCardProps) {
  const [expanded, setExpanded] = useState(false);
  const title = stream.game?.title || stream.gameTitle || "Jogo";
  const dateTimeLabel = formatDateTime(stream.scheduledDate, stream.scheduledTime);
  const validLinks = (stream.links ?? []).filter((link) => link.url.trim());
  const hasDetails = validLinks.length > 0 || Boolean(stream.notes?.trim());

  return (
    <article
      className={cn("admin-schedule-card group", expanded && "admin-schedule-card--expanded", className)}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col gap-1 text-left"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[13px] text-muted-foreground">{dateTimeLabel}</span>
          <span className="text-[14px] font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-[12px] text-muted-foreground">
          {streamerLabel ? `@${streamerLabel}` : null}
          {streamerLabel && stream.duration ? " · " : null}
          {stream.duration || (!streamerLabel ? "Duração não informada" : null)}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          ✏️ Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-destructive hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(stream.id);
          }}
        >
          🗑️ Cancelar stream
        </Button>
      </div>

      {expanded && hasDetails ? (
        <div className="admin-schedule-card-details w-full border-t border-outline-variant/20 pt-3">
          {validLinks.length > 0 ? (
            <div className="mb-3 space-y-1.5">
              <p className="text-caption font-medium text-muted-foreground">Links</p>
              <ul className="space-y-1">
                {validLinks.map((link, index) => (
                  <li key={`${link.url}-${index}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {link.name?.trim() || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {stream.notes?.trim() ? (
            <div>
              <p className="mb-1 text-caption font-medium text-muted-foreground">
                Observações
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {stream.notes}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {expanded && !hasDetails ? (
        <p className="w-full border-t border-outline-variant/20 pt-3 text-sm text-muted-foreground">
          Sem links ou observações para esta transmissão.
        </p>
      ) : null}
    </article>
  );
}
