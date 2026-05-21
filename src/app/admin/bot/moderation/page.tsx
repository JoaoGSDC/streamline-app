"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useBotBlacklistPage } from "@features/bot/hooks/use-bot-blacklist-page.hook";

const addTermSchema = z
  .object({
    term: z.string().min(1, "Informe o termo").max(100),
    matchType: z.enum(["exact", "contains"]),
    action: z.enum(["delete", "timeout"]),
    timeoutSeconds: z.coerce.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "timeout" && !data.timeoutSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a duração do timeout",
        path: ["timeoutSeconds"],
      });
    }
  });

type AddTermValues = z.infer<typeof addTermSchema>;

export default function BotModerationPage() {
  const { toast } = useToast();
  const {
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
  } = useBotBlacklistPage();

  const form = useForm<AddTermValues>({
    resolver: zodResolver(addTermSchema),
    defaultValues: {
      term: "",
      matchType: "contains",
      action: "delete",
      timeoutSeconds: 300,
    },
  });

  const action = form.watch("action");

  const handleAdd = form.handleSubmit(async (values) => {
    const ok = await addTerm({
      term: values.term,
      matchType: values.matchType,
      action: values.action,
      timeoutSeconds:
        values.action === "timeout" ? values.timeoutSeconds : undefined,
    });
    if (ok) {
      toast({ title: "Termo adicionado à blacklist" });
      form.reset({
        term: "",
        matchType: "contains",
        action: "delete",
        timeoutSeconds: 300,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o termo.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Moderação"
        description="Palavras e termos que o bot detectará no chat. Correspondência sem diferenciar maiúsculas/minúsculas."
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar termo
        </Button>
      </AdminPageHeader>

      <p className="rounded-md border border-outline-variant/30 bg-muted/30 px-3 py-2 text-body-sm text-muted-foreground">
        Regex não é suportado no MVP. Revise termos curtos para evitar falsos
        positivos.
      </p>

      <Input
        placeholder="Buscar termo…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={Shield}
          title="Blacklist vazia"
          description="Adicione termos inadequados para o bot moderar automaticamente."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar termo
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/30">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-muted px-1.5 py-0.5 text-body-sm">
                  {row.term}
                </code>
                <Badge variant="outline">{row.matchType}</Badge>
                <Badge variant="secondary">
                  {row.action === "timeout"
                    ? `timeout ${row.timeoutSeconds}s`
                    : "deletar"}
                </Badge>
                {!row.enabled && (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.enabled}
                  onCheckedChange={() => void toggleEnabled(row)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à blacklist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="term">Termo</Label>
              <Input id="term" {...form.register("term")} />
              {form.formState.errors.term && (
                <p className="text-body-sm text-destructive">
                  {form.formState.errors.term.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Correspondência</Label>
              <Select
                value={form.watch("matchType")}
                onValueChange={(value: "exact" | "contains") =>
                  form.setValue("matchType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="exact">Exata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ação</Label>
              <Select
                value={form.watch("action")}
                onValueChange={(value: "delete" | "timeout") =>
                  form.setValue("action", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Deletar mensagem</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === "timeout" && (
              <div className="space-y-2">
                <Label htmlFor="timeout">Duração (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={1}
                  {...form.register("timeoutSeconds")}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover termo?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.term}&quot; será removido da blacklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const ok = await confirmDelete();
                if (ok) toast({ title: "Termo removido" });
              }}
              disabled={submitting}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
