"use client";

import { useMemo, useState } from "react";
import { Download, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { TwitchAvatar } from "./TwitchAvatar";
import type { RaffleConfig, RaffleEntryRow } from "../types";
import type { RaffleStateActions, RaffleUiState } from "../hooks/useRaffleState";

function StatCell({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 text-center">
      <div
        className={cn(
          "text-lg font-semibold tabular-nums",
          highlight ? "text-purple-400" : "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ParticipantRow({
  entry,
  isWinner,
  onRemove,
}: {
  entry: RaffleEntryRow;
  isWinner?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 hover:bg-muted/20">
      <TwitchAvatar login={entry.twitchLogin} size={20} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{entry.displayName}</div>
        <div className="truncate font-mono text-[10px] text-muted-foreground">
          @{entry.twitchLogin}
          {entry.entryCount > 1 && ` ×${entry.entryCount}`}
        </div>
      </div>
      {isWinner && <Trophy className="h-3 w-3 shrink-0 text-amber-400" />}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </div>
  );
}

export function RaffleParticipants({
  raffle,
  state,
  actions,
}: {
  raffle: RaffleConfig | null;
  state: RaffleUiState;
  actions: RaffleStateActions;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const entries = raffle?.entries ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.twitchLogin.toLowerCase().includes(q) ||
        e.displayName.toLowerCase().includes(q)
    );
  }, [raffle?.entries, search]);

  const winnerIds = new Set(
    raffle?.winners.filter((w) => w.status !== "rerolled").map((w) => w.twitchUserId) ?? []
  );

  return (
    <div className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-2 divide-x divide-border/30 border-b border-border/30">
        <StatCell
          value={raffle?.entriesCount ?? 0}
          label="participando"
          highlight={!!raffle?.entriesCount}
        />
        <StatCell value={raffle?.uniqueUserCount ?? 0} label="únicos" />
      </div>

      <div className="shrink-0 border-b border-border/30 p-2">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5 text-xs focus:border-purple-500/50 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((entry) => (
          <ParticipantRow
            key={entry.id}
            entry={entry}
            isWinner={winnerIds.has(entry.twitchUserId)}
            onRemove={
              raffle && raffle.status !== "completed"
                ? () => actions.removeEntry(entry.id)
                : undefined
            }
          />
        ))}
        {filtered.length === 0 && search && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Nenhum participante encontrado
          </div>
        )}
        {!raffle && (
          <div className="py-6 text-center text-xs text-muted-foreground">—</div>
        )}
      </div>

      {(raffle?.entriesCount ?? 0) > 0 && (
        <div className="shrink-0 border-t border-border/30 p-2">
          <button
            type="button"
            onClick={actions.exportCSV}
            className="flex w-full items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            Exportar lista (.csv)
          </button>
        </div>
      )}
    </div>
  );
}
