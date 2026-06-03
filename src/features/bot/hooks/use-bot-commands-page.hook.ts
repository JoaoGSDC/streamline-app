"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@services";
import type { BotCommandRecord } from "@services/entities/bot-commands.services";
import type {
  BotBuiltinCategoryId,
  BotBuiltinCommandCatalogItem,
  BotVariablesCatalogResponse,
} from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";
import type { BotCommandRowState } from "@features/bot/components/BotCommandAccordionRow";
import { createRandomString } from "@utils/factories/create-random-string";

const SEARCH_DEBOUNCE_MS = 300;

const BUILTIN_CATEGORY_ORDER: BotBuiltinCategoryId[] = [
  "general",
  "raffles",
  "moderator",
  "streamer",
];

function recordToRow(
  record: BotCommandRecord,
  catalogItem?: BotBuiltinCommandCatalogItem,
  categoryLabel?: string
): BotCommandRowState {
  return {
    id: record.id,
    trigger: record.trigger,
    response: record.response,
    cooldownSeconds: record.cooldownSeconds,
    enabled: record.enabled,
    isBuiltin: Boolean(record.isBuiltin ?? record.builtinKey),
    builtinKey: record.builtinKey,
    description: catalogItem?.description,
    category: catalogItem?.category,
    categoryLabel,
    minRole: catalogItem?.minRole,
    argsHint: catalogItem?.argsHint,
    customizableResponse: catalogItem?.customizableResponse,
    runtimeNotes: catalogItem?.runtimeNotes,
    externalApiUrlTemplate: catalogItem?.externalApiUrlTemplate,
    responseTemplate: catalogItem?.responseTemplate,
    requiresConfirmation: catalogItem?.requiresConfirmation,
    confirmationPrompt: catalogItem?.confirmationPrompt,
  };
}

export function useBotCommandsPage() {
  const [savedRows, setSavedRows] = useState<BotCommandRowState[]>([]);
  const [draftRows, setDraftRows] = useState<BotCommandRowState[]>([]);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<BotCommandRowState>>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [catalog, setCatalog] = useState<BotVariablesCatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [emotes, setEmotes] = useState<TwitchChannelEmote[]>([]);
  const [emotesLoading, setEmotesLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState<string[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const builtinCatalogByKey = useMemo(() => {
    const map = new Map<string, BotBuiltinCommandCatalogItem>();
    catalog?.builtinCommands.forEach((item) => {
      map.set(item.key, item);
    });
    return map;
  }, [catalog]);

  const builtinCategoryLabels: Record<BotBuiltinCategoryId, string> =
    catalog?.builtinCommandCategories ?? {
      general: "Gerais",
      raffles: "Sorteios e interação",
      moderator: "Moderadores",
      streamer: "Streamer",
    };

  const enrichBuiltinRecord = useCallback(
    (record: BotCommandRecord) => {
      if (!record.builtinKey) {
        return recordToRow(record);
      }
      const catalogItem = builtinCatalogByKey.get(record.builtinKey);
      const categoryLabel = catalogItem?.category
        ? builtinCategoryLabels[catalogItem.category]
        : undefined;
      return recordToRow(record, catalogItem, categoryLabel);
    },
    [builtinCatalogByKey, builtinCategoryLabels]
  );

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
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
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
    (items: BotCommandRecord[]) => items.map((item) => enrichBuiltinRecord(item)),
    [enrichBuiltinRecord]
  );

  const upsertSavedRow = useCallback(
    (record: BotCommandRecord) => {
      const row = enrichBuiltinRecord(record);
      setSavedRows((prev) => {
        const index = prev.findIndex((item) => item.id === row.id);
        if (index === -1) {
          return [...prev, row].sort((a, b) => {
            if (a.isBuiltin !== b.isBuiltin) return a.isBuiltin ? -1 : 1;
            return a.trigger.localeCompare(b.trigger);
          });
        }
        const next = [...prev];
        next[index] = row;
        return next;
      });
    },
    [enrichBuiltinRecord]
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const result = await services.botCommands.list({
          search: debouncedSearch || undefined,
          limit: 100,
        });
        setSavedRows(mapRecordsToRows(result.items));
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
    [debouncedSearch, mapRecordsToRows]
  );

  useEffect(() => {
    void loadCatalog();
    void loadEmotes();
  }, [loadCatalog, loadEmotes]);

  useEffect(() => {
    void load();
  }, [load]);

  const getRowState = useCallback(
    (row: BotCommandRowState): BotCommandRowState => ({
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
    (id: string, patch: Partial<BotCommandRowState>) => {
      setLocalEdits((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
      markDirty(id);
    },
    [markDirty]
  );

  const isRowDirty = useCallback(
    (id: string) => {
      const edits = localEdits[id];
      if (!edits && !dirtyIds.has(id)) return false;
      const keys = Object.keys(edits ?? {});
      if (keys.length === 0) return dirtyIds.has(id);
      const contentKeys = keys.filter((key) => key !== "enabled");
      return contentKeys.length > 0;
    },
    [dirtyIds, localEdits]
  );

  const persistRow = useCallback(
    async (row: BotCommandRowState) => {
      const merged: BotCommandRowState = {
        ...row,
        ...localEdits[row.id],
      };

      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        if (merged.isDraft || merged.isNew) {
          const created = await services.botCommands.create({
            trigger: merged.trigger,
            response: merged.response,
            cooldownSeconds: merged.cooldownSeconds,
            enabled: merged.enabled,
          });
          setDraftRows((prev) => prev.filter((draft) => draft.id !== merged.id));
          upsertSavedRow(created);
          setOpenAccordion((prev) =>
            prev.map((value) => (value === merged.id ? created.id : value))
          );
          setLocalEdits((prev) => {
            const next = { ...prev };
            delete next[merged.id];
            return next;
          });
          clearDirty(merged.id);
          return true;
        }

        const updated = merged.isBuiltin
          ? await services.botCommands.update(merged.id, {
              response: merged.response,
              enabled: merged.enabled,
            })
          : await services.botCommands.update(merged.id, {
              trigger: merged.trigger,
              response: merged.response,
              cooldownSeconds: merged.cooldownSeconds,
              enabled: merged.enabled,
            });

        upsertSavedRow(updated);

        setLocalEdits((prev) => {
          const next = { ...prev };
          delete next[merged.id];
          return next;
        });
        clearDirty(merged.id);
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
    [clearDirty, localEdits, upsertSavedRow]
  );

  const updateRow = useCallback(
    (id: string, patch: Partial<BotCommandRowState>) => {
      patchLocal(id, patch);
    },
    [patchLocal]
  );

  const toggleEnabled = useCallback(
    async (row: BotCommandRowState, enabled: boolean) => {
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
        await services.botCommands.update(row.id, { enabled });

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
        setSavedRows((prev) =>
          prev.map((saved) =>
            saved.id === row.id ? { ...saved, enabled: !enabled } : saved
          )
        );
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [clearDirty, patchLocal]
  );

  const addDraftRow = useCallback(() => {
    const id = `draft-${createRandomString(8)}`;
    const draft: BotCommandRowState = {
      id,
      trigger: "!",
      response: "",
      cooldownSeconds: 0,
      enabled: true,
      isBuiltin: false,
      isDraft: true,
      isNew: true,
    };
    setDraftRows((prev) => [...prev, draft]);
    setOpenAccordion((prev) => [...prev, id]);
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
      setOpenAccordion((prev) => prev.filter((value) => value !== id));
    },
    [clearDirty]
  );

  const deleteCustomCommand = useCallback(
    async (row: BotCommandRowState) => {
      if (row.isBuiltin) return false;
      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        await services.botCommands.remove(row.id);
        setSavedRows((prev) => prev.filter((saved) => saved.id !== row.id));
        setLocalEdits((prev) => {
          const next = { ...prev };
          delete next[row.id];
          return next;
        });
        clearDirty(row.id);
        setOpenAccordion((prev) => prev.filter((value) => value !== row.id));
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
    [clearDirty]
  );

  const builtinRows = useMemo(
    () =>
      savedRows
        .filter((row) => row.isBuiltin)
        .map((row) => getRowState(row))
        .filter((row) =>
          debouncedSearch
            ? row.trigger.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true
        ),
    [savedRows, getRowState, debouncedSearch]
  );

  const builtinRowsByCategory = useMemo(() => {
    const grouped = Object.fromEntries(
      BUILTIN_CATEGORY_ORDER.map((category) => [category, [] as BotCommandRowState[]])
    ) as Record<BotBuiltinCategoryId, BotCommandRowState[]>;

    for (const row of builtinRows) {
      const category = (row.category as BotBuiltinCategoryId) ?? "general";
      grouped[category]?.push(row);
    }

    return grouped;
  }, [builtinRows]);

  const customRows = useMemo(
    () =>
      savedRows
        .filter((row) => !row.isBuiltin)
        .map((row) => getRowState(row))
        .filter((row) =>
          debouncedSearch
            ? row.trigger.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true
        ),
    [savedRows, getRowState, debouncedSearch]
  );

  const draftRowsMerged = useMemo(
    () => draftRows.map((row) => getRowState(row)),
    [draftRows, getRowState]
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
    openAccordion,
    setOpenAccordion,
    builtinRows,
    builtinRowsByCategory,
    builtinCategoryLabels,
    customRows,
    draftRows: draftRowsMerged,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleEnabled,
    removeDraftRow,
    deleteCustomCommand,
    getRowState,
    isRowDirty,
  };
}
