"use client";

import { MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { useBotCommandsPage } from "@features/bot/hooks/use-bot-commands-page.hook";
import { BotCommandFormDialog } from "@features/bot/components/BotCommandFormDialog";

export default function BotCommandsPage() {
  const { toast } = useToast();
  const {
    items,
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
    saveCommand,
    toggleEnabled,
    confirmDelete,
  } = useBotCommandsPage();

  const handleSave = async (values: {
    trigger: string;
    response: string;
    cooldownSeconds: number;
    enabled: boolean;
  }) => {
    const ok = await saveCommand(values);
    if (ok) {
      toast({
        title: editing ? "Comando atualizado" : "Comando criado",
        description: "O bot sincronizará na próxima conexão.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o comando.",
        variant: "destructive",
      });
    }
    return ok;
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (ok) {
      toast({ title: "Comando excluído" });
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
        title="Comandos"
        description="Respostas automáticas no chat quando alguém digita o trigger (ex.: !discord)."
      >
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo comando
        </Button>
      </AdminPageHeader>

      <Input
        placeholder="Buscar por trigger…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={MessageSquare}
          title="Nenhum comando ainda"
          description="Crie seu primeiro comando para o bot responder no chat da Twitch."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro comando
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant/30">
          <div className="hidden grid-cols-[1fr_2fr_100px_80px_120px] gap-4 border-b border-outline-variant/30 bg-surface-container-low/50 px-4 py-2 text-body-sm font-medium text-muted-foreground md:grid">
            <span>Trigger</span>
            <span>Resposta</span>
            <span>Cooldown</span>
            <span>Ativo</span>
            <span className="text-right">Ações</span>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {items.map((command) => (
              <li
                key={command.id}
                className="flex flex-col gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_2fr_100px_80px_120px] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-body-sm font-medium">
                    {command.trigger}
                  </code>
                  {!command.enabled && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <p className="truncate text-body-sm text-muted-foreground md:max-w-none">
                  {command.response}
                </p>
                <span className="text-body-sm text-muted-foreground">
                  {command.cooldownSeconds > 0
                    ? `${command.cooldownSeconds}s`
                    : "—"}
                </span>
                <Switch
                  checked={command.enabled}
                  onCheckedChange={() => void toggleEnabled(command)}
                  aria-label={`Ativar ${command.trigger}`}
                />
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(command)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(command)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <BotCommandFormDialog
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
              onClick={() => void handleDelete()}
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
