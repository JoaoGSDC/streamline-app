"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { raffles, type RaffleCreateInput } from "@services/entities/raffles.services";
import type { RaffleConfig } from "../types";

export function useRaffleState() {
  const [raffle, setRaffle] = useState<RaffleConfig | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "entries" | "chat">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await raffles.getActive();
        if (!cancelled) setRaffle(active);
      } catch {
        if (!cancelled) setRaffle(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async (id?: string) => {
    const targetId = id ?? raffle?.id;
    if (!targetId) return;
    const updated = await raffles.getById(targetId);
    setRaffle(updated);
  }, [raffle?.id]);

  const actions = useMemo(
    () => ({
      start: async (config: RaffleCreateInput) => {
        setIsLoading(true);
        try {
          const created = await raffles.create(config);
          const started = await raffles.start(created.id);
          setRaffle(started);
        } finally {
          setIsLoading(false);
        }
      },
      pause: async () => {
        if (!raffle) return;
        if (raffle.status === "paused") {
          setRaffle(await raffles.resume(raffle.id));
        } else {
          setRaffle(await raffles.pause(raffle.id));
        }
      },
      close: async () => {
        if (!raffle) return;
        setRaffle(await raffles.close(raffle.id));
      },
      reopen: async () => {
        if (!raffle) return;
        setRaffle(await raffles.reopen(raffle.id));
      },
      draw: async () => {
        if (!raffle) return;
        setRaffle(await raffles.draw(raffle.id));
      },
      reroll: async (winnerId: string) => {
        if (!raffle) return;
        setRaffle(await raffles.reroll(raffle.id, winnerId));
      },
      confirmWinner: async (winnerId: string) => {
        if (!raffle) return;
        const updated = await raffles.confirmWinner(raffle.id, winnerId);
        setRaffle(updated);
      },
      removeEntry: async (entryId: string) => {
        if (!raffle) return;
        setRaffle(await raffles.removeEntry(raffle.id, entryId));
      },
      addEntry: async (login: string, displayName?: string) => {
        if (!raffle) return;
        setRaffle(await raffles.addEntry(raffle.id, { twitchLogin: login, displayName }));
      },
      exportCSV: () => {
        if (!raffle) return;
        window.open(raffles.exportUrl(raffle.id), "_blank");
      },
      openHistory: () => setHistoryOpen(true),
      closeHistory: () => setHistoryOpen(false),
      setFilter,
      setRaffle,
      refresh,
      reset: () => setRaffle(null),
    }),
    [raffle, refresh]
  );

  return {
    raffle,
    state: { historyOpen, filter, isLoading },
    actions,
  };
}

export type RaffleStateActions = ReturnType<typeof useRaffleState>["actions"];
export type RaffleUiState = ReturnType<typeof useRaffleState>["state"];
