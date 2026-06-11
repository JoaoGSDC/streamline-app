"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { raffles, type RaffleHistoryItem } from "@services/entities/raffles.services";

export function RaffleHistory({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<RaffleHistoryItem[]>([]);
  const [tab, setTab] = useState<"all" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    raffles
      .getHistory()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab === "completed") list = list.filter((i) => i.status === "completed");
    if (tab === "cancelled") list = list.filter((i) => i.status === "cancelled");
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.winners.some((w) => w.twitchLogin.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, tab, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-[480px] flex-col border-l border-border/40 bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h2 className="font-semibold">Histórico de sorteios</h2>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-border/30 px-4 py-2">
          {(
            [
              ["all", "Todos"],
              ["completed", "Concluídos"],
              ["cancelled", "Cancelados"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded px-2 py-0.5 text-xs",
                tab === key ? "bg-purple-500/15 text-purple-300" : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="border-b border-border/30 p-3">
          <input
            className="w-full rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5 text-xs"
            placeholder="Buscar por título ou vencedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading && <p className="text-xs text-muted-foreground">Carregando...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum sorteio encontrado.</p>
          )}
          {filtered.map((item) => (
            <div
              key={item.id}
              className="mb-2 rounded-lg border border-border/40 p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{item.title ?? item.mode}</div>
                  <div className="text-muted-foreground">
                    {item.entriesCount} participantes · {item.status}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString("pt-BR")
                    : new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              {item.winners.length > 0 && (
                <div className="mt-2 text-purple-300">
                  🏆 {item.winners.map((w) => `@${w.twitchLogin}`).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
