"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModeratorDto } from "@api/internal/streamers/moderators.controller";
import { ModeratorAvatar } from "./ModeratorAvatar";

interface ModeratorListItemProps {
  moderator: ModeratorDto;
  onRemove: (moderatorId: string, username: string) => Promise<void>;
}

function formatSinceDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ModeratorListItem({
  moderator,
  onRemove,
}: ModeratorListItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleConfirmRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(moderator.moderatorId, moderator.moderatorUsername);
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <li
      className={cn(
        "group flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0",
        confirming && "bg-destructive/5 -mx-2 rounded-lg px-2"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ModeratorAvatar
          username={moderator.moderatorUsername}
          imageUrl={moderator.profileImageUrl}
          size={32}
        />
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-foreground">
            @{moderator.moderatorUsername}
          </p>
          <p className="text-[12px] text-muted-foreground">
            Desde {formatSinceDate(moderator.createdAt)}
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className="text-body-sm text-muted-foreground">
            Remover @{moderator.moderatorUsername}?
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={removing}
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={removing}
            onClick={() => void handleConfirmRemove()}
          >
            {removing ? "Removendo…" : "Remover"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={`Remover @${moderator.moderatorUsername}`}
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </li>
  );
}
