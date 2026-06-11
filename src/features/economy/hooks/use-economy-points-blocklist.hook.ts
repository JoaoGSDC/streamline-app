"use client";

import { useCallback, useEffect, useState } from "react";
import { economy } from "@services/entities/economy.services";
import type { EconomyPointsBlocklistEntryDto } from "@server/economy/economy.types";

export function useEconomyPointsBlocklist() {
  const [items, setItems] = useState<EconomyPointsBlocklistEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await economy.listPointsBlocklist());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (payload: {
      twitchLogin: string;
      twitchUserId?: string;
      displayName?: string;
      reason?: string;
    }) => {
      setAdding(true);
      try {
        const entry = await economy.addPointsBlocklist(payload);
        setItems((prev) => [entry, ...prev]);
        return true;
      } catch {
        return false;
      } finally {
        setAdding(false);
      }
    },
    []
  );

  const removeEntry = useCallback(async (entryId: string) => {
    setRemovingId(entryId);
    try {
      await economy.removePointsBlocklist(entryId);
      setItems((prev) => prev.filter((item) => item.id !== entryId));
      return true;
    } catch {
      return false;
    } finally {
      setRemovingId(null);
    }
  }, []);

  return {
    items,
    loading,
    adding,
    removingId,
    addEntry,
    removeEntry,
    refresh,
  };
}
