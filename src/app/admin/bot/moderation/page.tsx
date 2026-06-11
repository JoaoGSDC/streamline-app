"use client";

import { Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBotBlacklistPage } from "@features/bot/hooks/use-bot-blacklist-page.hook";
import { BotBlacklistQuickAdd } from "@features/bot/components/BotBlacklistQuickAdd";
import { BotBlacklistTable } from "@features/bot/components/BotBlacklistTable";

export default function BotModerationPage() {
  const { toast } = useToast();
  const {
    items,
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
  } = useBotBlacklistPage();

  const handleAdd = async (
    payload: Parameters<typeof addTerm>[0]
  ): Promise<boolean> => {
    const ok = await addTerm(payload);
    if (ok) {
      toast({ title: "Termo adicionado à blacklist" });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o termo.",
        variant: "destructive",
      });
    }
    return ok;
  };

  const handleUpdate = async (
    row: Parameters<typeof updateTerm>[0],
    patch: Parameters<typeof updateTerm>[1]
  ) => {
    const ok = await updateTerm(row, patch);
    if (!ok) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o termo.",
        variant: "destructive",
      });
    }
    return ok;
  };

  const handleDelete = async (row: Parameters<typeof deleteTerm>[0]) => {
    const ok = await deleteTerm(row);
    if (ok) {
      toast({ title: "Termo removido" });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível remover o termo.",
        variant: "destructive",
      });
    }
    return ok;
  };

  return (
    <div className="admin-page-stack overflow-x-hidden">
      <AdminPageHeader
        title="Moderação"
        description="Palavras, termos e patterns regex que o bot detectará no chat."
      />

      <p className="rounded-lg bg-muted/30 px-5 py-3 text-body-admin text-muted-foreground">
        Contém e Exato funcionam com palavras literais (sem diferenciar
        maiúsculas). Regex captura evasões — ex.: variações de &quot;bola&quot;
        como &quot;bolinha&quot; ou &quot;b0la&quot;. Patterns passam por
        validação anti-ReDoS antes de serem aceitos.
      </p>

      <BotBlacklistQuickAdd submitting={submitting} onSubmit={handleAdd} />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          placeholder="Buscar termo…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={Shield}
          title={search ? "Nenhum termo nesta busca" : "Blacklist vazia"}
          description={
            search
              ? "Tente outro termo ou limpe a busca."
              : "Use o formulário acima para adicionar o primeiro termo."
          }
        />
      ) : (
        <BotBlacklistTable
          rows={items}
          recentlyAddedIds={recentlyAddedIds}
          savingIds={savingIds}
          onUpdate={handleUpdate}
          onToggleEnabled={(row) => void toggleEnabled(row)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
