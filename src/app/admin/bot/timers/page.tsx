"use client";

import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { BotTimerFormDialog } from "@features/bot/components/BotTimerFormDialog";

export default function BotTimersPage() {
  const { toast } = useToast();
  const {
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
    saveTimer,
    toggleEnabled,
    confirmDelete,
  } = useBotTimersPage();

  const handleSave = async (values: {
    name?: string | null;
    intervalMinutes: number;
    message: string;
    enabled: boolean;
  }) => {
    const ok = await saveTimer(values);
    if (ok) {
      toast({ title: editing ? "Timer atualizado" : "Timer criado" });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o timer.",
        variant: "destructive",
      });
    }
    return ok;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Timers"
        description="Mensagens automáticas enviadas periodicamente no chat."
      >
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo timer
        </Button>
      </AdminPageHeader>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={Clock}
          title="Nenhum timer configurado"
          description="Crie lembretes periódicos para redes sociais, regras do canal ou promoções."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Criar timer
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/30">
          {items.map((timer) => (
            <li
              key={timer.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">
                    {timer.name || "Timer sem nome"}
                  </span>
                  <Badge variant="outline">
                    a cada {timer.intervalMinutes} min
                  </Badge>
                  {!timer.enabled && (
                    <Badge variant="secondary">Pausado</Badge>
                  )}
                </div>
                <p className="mt-1 truncate text-body-sm text-muted-foreground">
                  {timer.message}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={timer.enabled}
                  onCheckedChange={() => void toggleEnabled(timer)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(timer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(timer)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BotTimerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        submitting={submitting}
        onSubmit={handleSave}
      />

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
              onClick={async () => {
                const ok = await confirmDelete();
                if (ok) toast({ title: "Timer excluído" });
              }}
              disabled={submitting}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
