"use client";

import Link from "next/link";
import { MessageSquare, Plus, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
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
import { useState } from "react";
import { useBotCommandsPage } from "@features/bot/hooks/use-bot-commands-page.hook";
import { BotVariablesReference } from "@features/bot/components/BotVariablesReference";
import {
  BotCommandAccordionRow,
  type BotCommandRowState,
} from "@features/bot/components/BotCommandAccordionRow";
import type { BotBuiltinCategoryId } from "@services/entities/bot-variables.services";

const BUILTIN_CATEGORY_ORDER: BotBuiltinCategoryId[] = [
  "general",
  "raffles",
  "moderator",
  "streamer",
];

export default function BotCommandsPage() {
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<BotCommandRowState | null>(null);

  const {
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
    builtinCategoryLabels: builtinCategoryLabelsFromCatalog,
    customRows,
    draftRows,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleEnabled,
    removeDraftRow,
    deleteCustomCommand,
    isRowDirty,
  } = useBotCommandsPage();

  const handleSaveRow = async (row: BotCommandRowState) => {
    const ok = await persistRow(row);
    if (ok) {
      toast({
        title: "Comando salvo",
        description: "As alterações deste comando foram aplicadas.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar. Verifique trigger e mensagem.",
        variant: "destructive",
      });
    }
  };

  const renderRow = (row: BotCommandRowState) => (
    <BotCommandAccordionRow
      key={row.id}
      command={row}
      variables={allVariables}
      emotes={emotes}
      emotesLoading={emotesLoading}
      saving={savingIds.has(row.id)}
      hasUnsavedChanges={
        (isRowDirty(row.id) || Boolean(row.isDraft)) && !savingIds.has(row.id)
      }
      onChange={(patch) => updateRow(row.id, patch)}
      onSave={() => void handleSaveRow(row)}
      onDelete={
        row.isDraft
          ? () => removeDraftRow(row.id)
          : row.isBuiltin
            ? undefined
            : () => setDeleteTarget(row)
      }
      onToggleEnabled={(enabled) => void toggleEnabled(row, enabled)}
    />
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCustomCommand(deleteTarget);
    if (ok) {
      toast({ title: "Comando excluído" });
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
    <div className="space-y-6 overflow-x-hidden">
      <AdminPageHeader
        title="Comandos"
        description="Comandos padrão do StreaminHub e personalizados do seu canal. Use o botão Salvar em cada linha para aplicar as alterações."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bot/variables">
            <BookOpen className="mr-2 h-4 w-4" />
            Guia de variáveis
          </Link>
        </Button>
        <Button onClick={addDraftRow}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar comando
        </Button>
      </AdminPageHeader>

      <BotVariablesReference catalog={catalog} loading={catalogLoading} />

      <Input
        placeholder="Buscar por trigger…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-headline text-body-md font-semibold">
                Comandos padrão
              </h2>
              <span className="text-body-sm text-muted-foreground">
                ({builtinRows.length})
              </span>
            </div>
            <p className="text-body-sm text-muted-foreground">
              Não podem ser removidos. Comandos com link ou PIX permitem mensagem
              personalizada; os demais são executados automaticamente pelo bot.
            </p>
            <Accordion
              type="multiple"
              value={openAccordion}
              onValueChange={setOpenAccordion}
              className="space-y-6"
            >
              {BUILTIN_CATEGORY_ORDER.map((categoryId) => {
                const rows = builtinRowsByCategory[categoryId] ?? [];
                if (rows.length === 0) return null;

                return (
                  <div key={categoryId} className="space-y-2">
                    <h3 className="text-body-sm font-semibold text-foreground">
                      {builtinCategoryLabelsFromCatalog[categoryId] ?? categoryId}
                      <span className="ml-2 font-normal text-muted-foreground">
                        ({rows.length})
                      </span>
                    </h3>
                    <div className="space-y-2">{rows.map(renderRow)}</div>
                  </div>
                );
              })}
            </Accordion>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-body-md font-semibold">
              Comandos personalizados
              <span className="ml-2 font-normal text-muted-foreground">
                ({customRows.length + draftRows.length})
              </span>
            </h2>
            <Accordion
              type="multiple"
              value={openAccordion}
              onValueChange={setOpenAccordion}
              className="space-y-2"
            >
              {customRows.map(renderRow)}
              {draftRows.map(renderRow)}
            </Accordion>
            {customRows.length === 0 && draftRows.length === 0 && (
              <p className="rounded-lg border border-dashed border-outline-variant/40 px-4 py-8 text-center text-body-sm text-muted-foreground">
                Nenhum comando personalizado. Clique em &quot;Adicionar comando&quot;
                para criar uma nova linha.
              </p>
            )}
          </section>
        </div>
      )}

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
