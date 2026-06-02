"use client";

import Link from "next/link";
import { Clock, Plus, BookOpen } from "lucide-react";
import { useState } from "react";
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
import { useBotTimersPage } from "@features/bot/hooks/use-bot-timers-page.hook";
import { BotVariablesReference } from "@features/bot/components/BotVariablesReference";
import {
  BotTimerAccordionRow,
  type BotTimerRowState,
} from "@features/bot/components/BotTimerAccordionRow";

export default function BotTimersPage() {
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<BotTimerRowState | null>(
    null
  );

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
    timerRows,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleEnabled,
    removeDraftRow,
    deleteTimer,
    isRowDirty,
  } = useBotTimersPage();

  const handleSaveRow = async (row: BotTimerRowState) => {
    const ok = await persistRow(row);
    if (ok) {
      toast({
        title: "Timer salvo",
        description: "As alterações foram aplicadas.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar. Verifique intervalo e mensagem.",
        variant: "destructive",
      });
    }
  };

  const renderRow = (row: BotTimerRowState) => (
    <BotTimerAccordionRow
      key={row.id}
      timer={row}
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
          : () => setDeleteTarget(row)
      }
      onToggleEnabled={(enabled) => void toggleEnabled(row, enabled)}
    />
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTimer(deleteTarget);
    if (ok) {
      toast({ title: "Timer excluído" });
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Timers"
        description="Mensagens automáticas no chat, repetidas a cada X minutos desde o início da live. Salve cada timer pelo botão na linha."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bot/variables">
            <BookOpen className="mr-2 h-4 w-4" />
            Guia de variáveis
          </Link>
        </Button>
        <Button onClick={addDraftRow}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar timer
        </Button>
      </AdminPageHeader>

      <p className="rounded-lg border border-outline-variant/30 bg-surface-container-low/40 px-4 py-3 text-body-sm text-muted-foreground">
        <Clock className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
        Exemplo: live começa às <strong className="text-foreground">21:00</strong>
        , intervalo <strong className="text-foreground">5 min</strong>, primeira
        após <strong className="text-foreground">5 min</strong> → mensagens às{" "}
        <strong className="text-foreground">21:05, 21:10, 21:15…</strong> Use a
        mensagem para lembrar o chat do comando <code className="text-xs">!pix</code>{" "}
        ou cole o texto completo do PIX.
      </p>

      <BotVariablesReference catalog={catalog} loading={catalogLoading} />

      <Input
        placeholder="Buscar por nome ou mensagem…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : timerRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant/40 px-4 py-12 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum timer configurado</p>
          <p className="mt-1 text-body-sm text-muted-foreground">
            Crie lembretes periódicos durante a live — redes, PIX, regras do canal.
          </p>
          <Button className="mt-4" onClick={addDraftRow}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar timer
          </Button>
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={openAccordion}
          onValueChange={setOpenAccordion}
          className="space-y-2"
        >
          {timerRows.map(renderRow)}
        </Accordion>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir timer?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name || "Timer"}&quot; será removido.
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
