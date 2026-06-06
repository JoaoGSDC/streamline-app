"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StreamerGameStatus } from "@/lib/streamer-game-status";
import { StarRatingDisplay } from "./StarRatingDisplay";

export interface KanbanGameItem {
  id: string;
  status: string;
  streamerId?: string;
  gameId?: string | null;
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
  status?: StreamerGameStatus;
  customTitle?: string | null;
  customImage?: string | null;
}

interface KanbanCardProps {
  item: KanbanGameItem;
  isDragging: boolean;
  isDropped?: boolean;
  onEdit: (item: KanbanGameItem) => void;
  onRemove: (id: string) => void;
  normalizeImageUrl: (raw?: string | null) => string;
  streamerLabel?: string;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function KanbanCard({
  item,
  isDragging,
  isDropped = false,
  onEdit,
  onRemove,
  normalizeImageUrl,
  streamerLabel,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const status = item.status as StreamerGameStatus;
  const displayTitle = item.game?.title || item.customTitle || "Jogo";
  const img = normalizeImageUrl(item.customImage || item.game?.image || null);
  const showRating = status === "finished";

  return (
    <article
      className={cn(
        "admin-kanban-card group",
        isDragging && "admin-kanban-card--dragging",
        isDropped && "admin-kanban-card--dropped"
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(item.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt=""
          className="aspect-[3/4] w-full object-cover"
          draggable={false}
        />
        {streamerLabel ? (
          <span className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            @{streamerLabel}
          </span>
        ) : null}
        <div
          className="absolute inset-0 flex items-center justify-center gap-3 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-9 w-9"
            onClick={() => onEdit(item)}
            aria-label={`Editar ${displayTitle}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-9 w-9"
            onClick={() => onRemove(item.id)}
            aria-label={`Remover ${displayTitle}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
          {displayTitle}
        </p>
        {showRating && <StarRatingDisplay value={item.rating} className="mt-1" />}
      </div>
    </article>
  );
}
