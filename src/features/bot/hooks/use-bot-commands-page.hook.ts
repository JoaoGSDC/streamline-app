"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@services";
import type {
  BotCommandRecord,
  CreateBotCommandPayload,
} from "@services/entities/bot-commands.services";

const SEARCH_DEBOUNCE_MS = 300;

export function useBotCommandsPage() {
  const [items, setItems] = useState<BotCommandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BotCommandRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BotCommandRecord | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.botCommands.list({
        search: debouncedSearch || undefined,
        limit: 100,
      });
      setItems(result.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((command: BotCommandRecord) => {
    setEditing(command);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  const saveCommand = useCallback(
    async (payload: CreateBotCommandPayload) => {
      setSubmitting(true);
      try {
        if (editing) {
          await services.botCommands.update(editing.id, payload);
        } else {
          await services.botCommands.create(payload);
        }
        closeDialog();
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [editing, closeDialog, load]
  );

  const toggleEnabled = useCallback(
    async (command: BotCommandRecord) => {
      try {
        await services.botCommands.update(command.id, {
          enabled: !command.enabled,
        });
        await load();
      } catch {
        /* toast no page */
      }
    },
    [load]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return false;
    setSubmitting(true);
    try {
      await services.botCommands.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [deleteTarget, load]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.trigger.localeCompare(b.trigger)),
    [items]
  );

  return {
    items: sortedItems,
    loading,
    search,
    setSearch,
    submitting,
    dialogOpen,
    setDialogOpen,
    editing,
    deleteTarget,
    setDeleteTarget,
    openCreate,
    openEdit,
    closeDialog,
    saveCommand,
    toggleEnabled,
    confirmDelete,
  };
}
