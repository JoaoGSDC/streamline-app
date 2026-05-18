"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamerGameCoverCardProps {
  imageUrl: string;
  hasNotes?: boolean;
  onClick: () => void;
  className?: string;
}

export function StreamerGameCoverCard({
  imageUrl,
  hasNotes,
  onClick,
  className,
}: StreamerGameCoverCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("streamer-game-cover-card", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" draggable={false} />
      {hasNotes ? (
        <span
          className="streamer-game-cover-card__notes-icon"
          aria-label="Observação do streamer"
        >
          <MessageSquare className="h-3 w-3" strokeWidth={2} />
        </span>
      ) : null}
    </button>
  );
}

export function buildGameFromStreamerItem(it: {
  id: string;
  status?: string;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
  rating?: number | null;
  notes?: string | null;
  customTitle?: string | null;
  customImage?: string | null;
  game?: {
    id: string;
    title?: string;
    image?: string | null;
    synopsis?: string | null;
    genre?: string[];
    platform?: string;
    igdbId?: number;
    storeLinks?: Array<{ name: string; url: string }>;
  } | null;
}) {
  const streamerMeta = {
    streamerGameId: it.id,
    status: it.status,
    startedAt: it.startedAt,
    finishedAt: it.finishedAt,
    rating: it.rating,
    notes: it.notes ?? undefined,
  };

  if (it.game) {
    return {
      id: it.game.id,
      title: it.game.title,
      image: it.game.image,
      synopsis: it.game.synopsis,
      genre: it.game.genre,
      platform: it.game.platform,
      igdbId: it.game.igdbId,
      storeLinks: it.game.storeLinks,
      ...streamerMeta,
    };
  }
  return {
    id: it.id,
    title: it.customTitle,
    image: it.customImage,
    synopsis: undefined,
    genre: [] as string[],
    platform: undefined,
    ...streamerMeta,
  };
}
