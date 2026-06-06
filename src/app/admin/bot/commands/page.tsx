"use client";

import Link from "next/link";
import { MessageSquare, Plus, BookOpen, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBotCommandsPage } from "@features/bot/hooks/use-bot-commands-page.hook";
import { BotVariablesReference } from "@features/bot/components/BotVariablesReference";
import { BotCommandCategoryFilters } from "@features/bot/components/BotCommandCategoryFilters";
import { BotCommandsTable } from "@features/bot/components/BotCommandsTable";
import { BotCommandEditDialog } from "@features/bot/components/BotCommandEditDialog";
import type { BotCommandRowState } from "@features/bot/types/bot-command.types";

export default function BotCommandsPage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BotCommandRowState | null>(null);

  const {
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    categoryCounts,
    filteredRows,
    catalog,
    catalogLoading,
    allVariables,
    emotes,
    emotesLoading,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleEnabled,
    removeDraftRow,
    deleteCustomCommand,
    getRowById,
    revertLocalEdits,
  } = useBotCommandsPage();

  const editingCommand = getRowById(editingId);

  const openDialog = useCallback((id: string) => {
    setSaveError(false);
    setEditingId(id);
    setDialogOpen(true);
  }, []);

  const handleAddCommand = () => {
    const id = addDraftRow();
    openDialog(id);
  };

  const handleEdit = (row: BotCommandRowState) => {
    openDialog(row.id);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSaveError(false);
      if (editingId) {
        const row = getRowById(editingId);
        if (row?.isDraft) {
          removeDraftRow(editingId);
        } else {
          revertLocalEdits(editingId);
        }
        setEditingId(null);
      }
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
    setSaveError(false);
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!editingCommand) return;
    setSaveError(false);
    const savedId = await persistRow(editingCommand);
    if (savedId) {
      toast({
        title: "Comando atualizado",
        description: "As alterações deste comando foram aplicadas.",
      });
      setTimeout(() => {
        setEditingId(null);
        setDialogOpen(false);
      }, 150);
    } else {
      setSaveError(true);
    }
  };

  const handleDeleteFromDialog = () => {
    if (!editingCommand || editingCommand.isBuiltin) return;
    setDeleteTarget(editingCommand);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCustomCommand(deleteTarget);
    if (ok) {
      toast({ title: "Comando excluído" });
      if (editingId === deleteTarget.id) {
        setDialogOpen(false);
        setEditingId(null);
      }
      setDeleteTarget(null);
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
        title="Comandos"
        description="Comandos padrão do StreaminHub e personalizados do seu canal."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bot/variables">
            <BookOpen className="mr-2 h-4 w-4" />
            Guia de variáveis
          </Link>
        </Button>
        <Button onClick={handleAddCommand}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar comando
        </Button>
      </AdminPageHeader>

      <BotVariablesReference catalog={catalog} loading={catalogLoading} />

      <div className="admin-subsection-stack">
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Buscar por comando ou resposta…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <BotCommandCategoryFilters
          value={categoryFilter}
          onChange={setCategoryFilter}
          counts={categoryCounts}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <AdminEmptyState
          icon={MessageSquare}
          title={
            search || categoryFilter !== "all"
              ? "Nenhum comando neste filtro"
              : "Crie seus primeiros comandos customizados"
          }
          description={
            search || categoryFilter !== "all"
              ? "Ajuste a busca ou a categoria para ver outros comandos."
              : "Comandos personalizados respondem à sua comunidade com mensagens únicas do seu canal."
          }
          action={
            search || categoryFilter !== "all" ? undefined : (
              <Button onClick={handleAddCommand}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar comando
              </Button>
            )
          }
        />
      ) : (
        <BotCommandsTable
          rows={filteredRows}
          savingIds={savingIds}
          onToggleEnabled={(row, enabled) => void toggleEnabled(row, enabled)}
          onEdit={handleEdit}
        />
      )}

      <BotCommandEditDialog
        open={dialogOpen}
        command={editingCommand}
        variables={allVariables}
        emotes={emotes}
        emotesLoading={emotesLoading}
        saving={editingId ? savingIds.has(editingId) : false}
        saveError={saveError}
        onOpenChange={handleDialogOpenChange}
        onChange={(patch) => editingId && updateRow(editingId, patch)}
        onSave={() => void handleSave()}
        onCancel={handleCancelEdit}
        onDelete={
          editingCommand && !editingCommand.isBuiltin && !editingCommand.isDraft
            ? handleDeleteFromDialog
            : undefined
        }
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comando?</AlertDialogTitle>
            <AlertDialogDescription>
              O comando <strong>{deleteTarget?.trigger}</strong> será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleConfirmDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
