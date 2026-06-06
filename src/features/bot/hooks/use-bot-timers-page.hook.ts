"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@services";
import type { BotTimerRecord } from "@services/entities/bot-timers.services";
import type { BotVariablesCatalogResponse } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";
import type { BotTimerRowState } from "@features/bot/types/bot-timer.types";
import { createRandomString } from "@utils/factories/create-random-string";

const SEARCH_DEBOUNCE_MS = 200;

function recordToRow(record: BotTimerRecord): BotTimerRowState {
  return {
    id: record.id,
    name: record.name ?? "",
    intervalMinutes: record.intervalMinutes,
    firstRunAfterMinutes: record.firstRunAfterMinutes,
    scheduleMode: record.scheduleMode ?? "live_elapsed",
    message: record.message,
    minViewers: record.minViewers ?? null,
    enabled: record.enabled,
  };
}

function matchesSearch(row: BotTimerRowState, query: string): boolean {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return (
    row.name.toLowerCase().includes(normalized) ||
    row.message.toLowerCase().includes(normalized)
  );
}

export function useBotTimersPage() {
  const [savedRows, setSavedRows] = useState<BotTimerRowState[]>([]);
  const [draftRows, setDraftRows] = useState<BotTimerRowState[]>([]);
  const [localEdits, setLocalEdits] = useState<
    Record<string, Partial<BotTimerRowState>>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [catalog, setCatalog] = useState<BotVariablesCatalogResponse | null>(
    null
  );
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [emotes, setEmotes] = useState<TwitchChannelEmote[]>([]);
  const [emotesLoading, setEmotesLoading] = useState(true);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const allVariables = useMemo(
    () =>
      catalog
        ? [
            ...catalog.globals,
            ...(catalog.commandArgs ?? []),
            ...catalog.counters,
            ...catalog.timers,
          ]
        : [],
    [catalog]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [search]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const data = await services.botVariables.getCatalog();
      setCatalog(data);
    } catch {
      setCatalog(null);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadEmotes = useCallback(async () => {
    setEmotesLoading(true);
    try {
      const data = await services.botEmotes.listChannel();
      setEmotes(data.emotes);
    } catch {
      setEmotes([]);
    } finally {
      setEmotesLoading(false);
    }
  }, []);

  const mapRecordsToRows = useCallback(
    (items: BotTimerRecord[]) => items.map(recordToRow),
    []
  );

  const upsertSavedRow = useCallback((record: BotTimerRecord) => {
    const row = recordToRow(record);
    setSavedRows((prev) => {
      const index = prev.findIndex((item) => item.id === row.id);
      if (index === -1) {
        return [...prev, row].sort((a, b) =>
          (a.name || a.message || a.id).localeCompare(b.name || b.message || b.id)
        );
      }
      const next = [...prev];
      next[index] = row;
      return next;
    });
  }, []);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const items = await services.botTimers.list();
        setSavedRows(mapRecordsToRows(items));
        if (!options?.silent) {
          setLocalEdits({});
          setDirtyIds(new Set());
        }
      } catch {
        if (!options?.silent) {
          setSavedRows([]);
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [mapRecordsToRows]
  );

  useEffect(() => {
    void loadCatalog();
    void loadEmotes();
  }, [loadCatalog, loadEmotes]);

  useEffect(() => {
    void load();
  }, [load]);

  const getRowState = useCallback(
    (row: BotTimerRowState): BotTimerRowState => ({
      ...row,
      ...localEdits[row.id],
    }),
    [localEdits]
  );

  const markDirty = useCallback((id: string) => {
    setDirtyIds((prev) => new Set(prev).add(id));
  }, []);

  const clearDirty = useCallback((id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const patchLocal = useCallback(
    (id: string, patch: Partial<BotTimerRowState>) => {
      setLocalEdits((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
      markDirty(id);
    },
    [markDirty]
  );

  const persistRow = useCallback(
    async (row: BotTimerRowState) => {
      const merged: BotTimerRowState = {
        ...row,
        ...localEdits[row.id],
      };

      if (!merged.message.trim()) {
        return null;
      }

      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        const payload = {
          name: merged.name.trim() || null,
          intervalMinutes: merged.intervalMinutes,
          firstRunAfterMinutes: merged.firstRunAfterMinutes,
          scheduleMode: merged.scheduleMode,
          message: merged.message.trim(),
          minViewers: merged.minViewers ?? null,
          enabled: merged.enabled,
        };

        if (merged.isDraft || merged.isNew) {
          const created = await services.botTimers.create(payload);
          setDraftRows((prev) => prev.filter((draft) => draft.id !== merged.id));
          upsertSavedRow(created);
          setLocalEdits((prev) => {
            const next = { ...prev };
            delete next[merged.id];
            return next;
          });
          clearDirty(merged.id);
          return created.id;
        }

        const updated = await services.botTimers.update(merged.id, payload);
        upsertSavedRow(updated);
        setLocalEdits((prev) => {
          const next = { ...prev };
          delete next[merged.id];
          return next;
        });
        clearDirty(merged.id);
        return merged.id;
      } catch {
        return null;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [clearDirty, localEdits, upsertSavedRow]
  );

  const updateRow = useCallback(
    (id: string, patch: Partial<BotTimerRowState>) => {
      patchLocal(id, patch);
    },
    [patchLocal]
  );

  const toggleEnabled = useCallback(
    async (row: BotTimerRowState, enabled: boolean) => {
      if (row.isDraft || row.isNew) {
        patchLocal(row.id, { enabled });
        return;
      }

      setSavedRows((prev) =>
        prev.map((saved) =>
          saved.id === row.id ? { ...saved, enabled } : saved
        )
      );

      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        await services.botTimers.update(row.id, { enabled });
        setLocalEdits((prev) => {
          const current = prev[row.id];
          if (!current) return prev;
          const { enabled: _removed, ...rest } = current;
          if (Object.keys(rest).length === 0) {
            const next = { ...prev };
            delete next[row.id];
            clearDirty(row.id);
            return next;
          }
          return { ...prev, [row.id]: rest };
        });
      } catch {
        await load({ silent: true });
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [clearDirty, load, patchLocal]
  );

  const addDraftRow = useCallback(() => {
    const id = `draft-${createRandomString(8)}`;
    const draft: BotTimerRowState = {
      id,
      name: "",
      intervalMinutes: 5,
      firstRunAfterMinutes: 5,
      scheduleMode: "live_elapsed",
      message: "",
      minViewers: null,
      enabled: true,
      isDraft: true,
      isNew: true,
    };
    setDraftRows((prev) => [...prev, draft]);
    return id;
  }, []);

  const removeDraftRow = useCallback(
    (id: string) => {
      setDraftRows((prev) => prev.filter((row) => row.id !== id));
      setLocalEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      clearDirty(id);
    },
    [clearDirty]
  );

  const deleteTimer = useCallback(
    async (row: BotTimerRowState) => {
      if (row.isDraft || row.isNew) {
        removeDraftRow(row.id);
        return true;
      }

      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        await services.botTimers.remove(row.id);
        setSavedRows((prev) => prev.filter((item) => item.id !== row.id));
        setLocalEdits((prev) => {
          const next = { ...prev };
          delete next[row.id];
          return next;
        });
        clearDirty(row.id);
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
    [clearDirty, removeDraftRow]
  );

  const allRows = useMemo(() => {
    return [
      ...savedRows.map((row) => getRowState(row)),
      ...draftRows.map((row) => getRowState(row)),
    ];
  }, [savedRows, draftRows, getRowState]);

  const timerRows = useMemo(
    () => allRows.filter((row) => matchesSearch(row, debouncedSearch)),
    [allRows, debouncedSearch]
  );

  const getRowById = useCallback(
    (id: string | null): BotTimerRowState | null => {
      if (!id) return null;
      return allRows.find((row) => row.id === id) ?? null;
    },
    [allRows]
  );

  const revertLocalEdits = useCallback(
    (id: string) => {
      setLocalEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      clearDirty(id);
    },
    [clearDirty]
  );

  return {
    loading,
    search,
    setSearch,
    catalog,
    catalogLoading,
    allVariables,
    emotes,
    emotesLoading,
    timerRows,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleEnabled,
    removeDraftRow,
    deleteTimer,
    getRowById,
    revertLocalEdits,
  };
}
