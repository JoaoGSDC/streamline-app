"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@services";
import type {
  BotBlacklistAction,
  BotBlacklistMatchType,
  BotBlacklistRecord,
  CreateBotBlacklistPayload,
} from "@services/entities/bot-blacklist.services";

const SEARCH_DEBOUNCE_MS = 200;

export function useBotBlacklistPage() {
  const [items, setItems] = useState<BotBlacklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await services.botBlacklist.list();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    const query = debouncedSearch.toLowerCase();
    return items.filter((item) => item.term.toLowerCase().includes(query));
  }, [debouncedSearch, items]);

  const addTerm = useCallback(async (payload: CreateBotBlacklistPayload) => {
    setSubmitting(true);
    try {
      const created = await services.botBlacklist.create(payload);
      setItems((prev) => [created, ...prev]);
      setRecentlyAddedIds((prev) => {
        const next = new Set(prev);
        next.add(created.id);
        return next;
      });
      window.setTimeout(() => {
        setRecentlyAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(created.id);
          return next;
        });
      }, 400);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateTerm = useCallback(
    async (
      row: BotBlacklistRecord,
      patch: Partial<{
        term: string;
        matchType: BotBlacklistMatchType;
        action: BotBlacklistAction;
        timeoutSeconds: number;
      }>
    ) => {
      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        const updated = await services.botBlacklist.update(row.id, patch);
        setItems((prev) =>
          prev.map((item) => (item.id === row.id ? updated : item))
        );
        return true;
      } catch {
        return false;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    []
  );

  const toggleEnabled = useCallback(async (row: BotBlacklistRecord) => {
    const nextEnabled = !row.enabled;
    setItems((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, enabled: nextEnabled } : item
      )
    );
    setSavingIds((prev) => new Set(prev).add(row.id));
    try {
      const updated = await services.botBlacklist.update(row.id, {
        enabled: nextEnabled,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === row.id ? updated : item))
      );
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, enabled: row.enabled } : item
        )
      );
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  }, []);

  const deleteTerm = useCallback(async (row: BotBlacklistRecord) => {
    setSavingIds((prev) => new Set(prev).add(row.id));
    try {
      await services.botBlacklist.remove(row.id);
      setItems((prev) => prev.filter((item) => item.id !== row.id));
      return true;
    } catch {
      return false;
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  }, []);

  return {
    items: filteredItems,
    loading,
    search,
    setSearch,
    submitting,
    savingIds,
    recentlyAddedIds,
    addTerm,
    updateTerm,
    toggleEnabled,
    deleteTerm,
  };
}
