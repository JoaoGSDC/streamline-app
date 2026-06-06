"use client";

import Link from "next/link";
import { Clock, Plus, BookOpen, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBotTimersPage } from "@features/bot/hooks/use-bot-timers-page.hook";
import { BotVariablesReference } from "@features/bot/components/BotVariablesReference";
import { BotTimersTable } from "@features/bot/components/BotTimersTable";
import { BotTimerEditDrawer } from "@features/bot/components/BotTimerEditDrawer";
import type { BotTimerRowState } from "@features/bot/types/bot-timer.types";

export default function BotTimersPage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
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
  } = useBotTimersPage();

  const editingTimer = getRowById(editingId);

  const openDrawer = useCallback((id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  }, []);

  const handleCreateTimer = () => {
    const id = addDraftRow();
    openDrawer(id);
  };

  const handleEdit = (row: BotTimerRowState) => {
    openDrawer(row.id);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open && editingId) {
      const row = getRowById(editingId);
      if (row?.isDraft) {
        removeDraftRow(editingId);
      } else {
        revertLocalEdits(editingId);
      }
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    if (!editingId) return;
    const row = getRowById(editingId);
    if (row?.isDraft) {
      removeDraftRow(editingId);
    } else {
      revertLocalEdits(editingId);
    }
    setEditingId(null);
    setDrawerOpen(false);
  };

  const handleSave = async () => {
    if (!editingTimer) return;
    const savedId = await persistRow(editingTimer);
    if (savedId) {
      toast({
        title: "Timer salvo",
        description: "As alterações foram aplicadas.",
      });
      setEditingId(null);
      setDrawerOpen(false);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar. Verifique intervalo e mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (row: BotTimerRowState) => {
    const ok = await deleteTimer(row);
    if (ok) {
      toast({ title: "Timer excluído" });
      if (editingId === row.id) {
        setDrawerOpen(false);
        setEditingId(null);
      }
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="admin-page-stack overflow-x-hidden">
      <AdminPageHeader
        title="Timers"
        description="Mensagens automáticas no chat, repetidas a cada X minutos desde o início da live."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bot/variables">
            <BookOpen className="mr-2 h-4 w-4" />
            Guia de variáveis
          </Link>
        </Button>
        <Button onClick={handleCreateTimer}>
          <Plus className="mr-2 h-4 w-4" />
          Criar timer
        </Button>
      </AdminPageHeader>

      <p className="rounded-lg bg-surface-container-low/40 px-5 py-3 text-body-admin text-muted-foreground">
        <Clock className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
        Exemplo: live começa às <strong className="text-foreground">21:00</strong>
        , intervalo <strong className="text-foreground">5 min</strong> → mensagens às{" "}
        <strong className="text-foreground">21:05, 21:10, 21:15…</strong>
      </p>

      <BotVariablesReference catalog={catalog} loading={catalogLoading} />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          placeholder="Buscar por nome ou mensagem…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : timerRows.length === 0 ? (
        <AdminEmptyState
          icon={Clock}
          title={
            search
              ? "Nenhum timer nesta busca"
              : "Nenhum timer configurado"
          }
          description={
            search
              ? "Tente outro termo ou limpe a busca para ver todos os timers."
              : "Crie lembretes periódicos durante a live — redes, PIX, regras do canal."
          }
          action={
            search ? undefined : (
              <Button onClick={handleCreateTimer}>
                <Plus className="mr-2 h-4 w-4" />
                Criar timer
              </Button>
            )
          }
        />
      ) : (
        <BotTimersTable
          rows={timerRows}
          savingIds={savingIds}
          onToggleEnabled={(row, enabled) => void toggleEnabled(row, enabled)}
          onEdit={handleEdit}
          onDelete={(row) => void handleDelete(row)}
        />
      )}

      <BotTimerEditDrawer
        open={drawerOpen}
        timer={editingTimer}
        variables={allVariables}
        emotes={emotes}
        emotesLoading={emotesLoading}
        saving={editingId ? savingIds.has(editingId) : false}
        onOpenChange={handleDrawerOpenChange}
        onChange={(patch) => editingId && updateRow(editingId, patch)}
        onSave={() => void handleSave()}
        onCancel={handleCancelEdit}
      />
    </div>
  );
}
