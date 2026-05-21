"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type {
  BotBlacklistRecord,
  CreateBotBlacklistPayload,
} from "@services/entities/bot-blacklist.services";

const SEARCH_DEBOUNCE_MS = 300;

export function useBotBlacklistPage() {
  const [items, setItems] = useState<BotBlacklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BotBlacklistRecord | null>(
    null
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
      const list = await services.botBlacklist.list(
        debouncedSearch || undefined
      );
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTerm = useCallback(
    async (payload: CreateBotBlacklistPayload) => {
      setSubmitting(true);
      try {
        await services.botBlacklist.create(payload);
        setDialogOpen(false);
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  const toggleEnabled = useCallback(
    async (term: BotBlacklistRecord) => {
      try {
        await services.botBlacklist.update(term.id, {
          enabled: !term.enabled,
        });
        await load();
      } catch {
        /* page handles */
      }
    },
    [load]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return false;
    setSubmitting(true);
    try {
      await services.botBlacklist.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [deleteTarget, load]);

  return {
    items,
    loading,
    search,
    setSearch,
    submitting,
    dialogOpen,
    setDialogOpen,
    deleteTarget,
    setDeleteTarget,
    addTerm,
    toggleEnabled,
    confirmDelete,
  };
}
