"use client";

import { cn } from "@/lib/utils";
import type { RaffleStatus } from "../types";

const LABELS: Record<RaffleStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  closed: "Fechado",
  drawing: "Sorteando",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const COLORS: Record<RaffleStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/15 text-green-400",
  paused: "bg-amber-500/15 text-amber-400",
  closed: "bg-blue-500/15 text-blue-400",
  drawing: "bg-purple-500/15 text-purple-400",
  completed: "bg-purple-500/15 text-purple-300",
  cancelled: "bg-destructive/15 text-destructive",
};

export function RaffleStatusBadge({ status }: { status: RaffleStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLORS[status] ?? COLORS.draft
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
