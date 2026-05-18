"use client";

import { useEffect, useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRatingInput } from "@/components/shared/StarRatingInput";
import { cn } from "@/lib/utils";
import {
  toDateInputValue,
  type StreamerGameStatus,
} from "@/lib/streamer-game-status";

export interface KanbanGameItem {
  id: string;
  status: string;
  streamerId?: string;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
  rating?: number | null;
  notes?: string | null;
  sortOrder?: number | null;
  game?: { title?: string; image?: string | null } | null;
  customTitle?: string | null;
  customImage?: string | null;
}

export interface KanbanGameMetaPatch {
  notes?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  rating?: number | null;
}

interface KanbanCardProps {
  item: KanbanGameItem;
  isDragging: boolean;
  onRemove: (id: string) => void;
  onSaveMeta: (id: string, patch: KanbanGameMetaPatch) => void;
  normalizeImageUrl: (raw?: string | null) => string;
  streamerLabel?: string;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function KanbanCard({
  item,
  isDragging,
  onRemove,
  onSaveMeta,
  normalizeImageUrl,
  streamerLabel,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const status = item.status as StreamerGameStatus;
  const [notes, setNotes] = useState(item.notes || "");
  const [startedAt, setStartedAt] = useState(toDateInputValue(item.startedAt));
  const [finishedAt, setFinishedAt] = useState(toDateInputValue(item.finishedAt));
  const [rating, setRating] = useState<number | null>(
    item.rating != null ? Number(item.rating) : null
  );

  useEffect(() => {
    setNotes(item.notes || "");
    setStartedAt(toDateInputValue(item.startedAt));
    setFinishedAt(toDateInputValue(item.finishedAt));
    setRating(item.rating != null ? Number(item.rating) : null);
  }, [item.id, item.notes, item.startedAt, item.finishedAt, item.rating]);

  const displayTitle = item.game?.title || item.customTitle || "Jogo";
  const img = normalizeImageUrl(item.game?.image || item.customImage || null);
  const isFinished = status === "finished" || status === "dropped";

  const saveMeta = () => {
    onSaveMeta(item.id, {
      notes,
      startedAt: startedAt || null,
      finishedAt: isFinished ? finishedAt || null : null,
      rating: isFinished ? rating : null,
    });
  };

  return (
    <article
      className={cn(
        "admin-kanban-card group",
        isDragging && "admin-kanban-card--dragging"
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(item.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt=""
          className="h-32 w-full object-cover"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--surface-container-high))] via-transparent to-transparent" />
        {streamerLabel ? (
          <span className="absolute left-2 top-2 rounded-md bg-[hsl(var(--neon-purple-glow)/0.25)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground backdrop-blur-sm">
            @{streamerLabel}
          </span>
        ) : null}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
          <p className="line-clamp-2 font-headline text-body-sm font-semibold leading-tight text-foreground">
            {displayTitle}
          </p>
          <GripVertical
            className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>
      </div>
      <div className="space-y-3 p-3" onMouseDown={(e) => e.stopPropagation()}>
        {isFinished ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 min-w-0">
              <Label className="text-[10px] text-muted-foreground">
                Início
              </Label>
              <Input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="input-cinematic h-9 px-2 text-body-sm"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-[10px] text-muted-foreground">
                Finalizado
              </Label>
              <Input
                type="date"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
                className="input-cinematic h-9 px-2 text-body-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-caption text-muted-foreground">
              {status === "to_play"
                ? "Previsão para começar"
                : "Início / previsão"}
            </Label>
            <Input
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="input-cinematic h-9 text-body-sm"
            />
          </div>
        )}

        {isFinished && (
          <div className="space-y-1">
            <Label className="text-caption text-muted-foreground">Nota</Label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-caption text-muted-foreground">
            Observações
          </Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas sobre o jogo..."
            rows={2}
            className="input-cinematic w-full resize-none rounded-md p-2 text-body-sm outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            type="button"
            onClick={saveMeta}
          >
            Salvar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
