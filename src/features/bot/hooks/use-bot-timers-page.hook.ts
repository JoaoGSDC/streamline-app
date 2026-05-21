"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type {
  BotTimerRecord,
  CreateBotTimerPayload,
} from "@services/entities/bot-timers.services";

export function useBotTimersPage() {
  const [items, setItems] = useState<BotTimerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BotTimerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BotTimerRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await services.botTimers.list();
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

  const openCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((timer: BotTimerRecord) => {
    setEditing(timer);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  const saveTimer = useCallback(
    async (payload: CreateBotTimerPayload) => {
      setSubmitting(true);
      try {
        if (editing) {
          await services.botTimers.update(editing.id, payload);
        } else {
          await services.botTimers.create(payload);
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
    async (timer: BotTimerRecord) => {
      try {
        await services.botTimers.update(timer.id, { enabled: !timer.enabled });
        await load();
      } catch {
        /* handled in page */
      }
    },
    [load]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return false;
    setSubmitting(true);
    try {
      await services.botTimers.remove(deleteTarget.id);
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
    submitting,
    dialogOpen,
    setDialogOpen,
    editing,
    deleteTarget,
    setDeleteTarget,
    openCreate,
    openEdit,
    closeDialog,
    saveTimer,
    toggleEnabled,
    confirmDelete,
  };
}
