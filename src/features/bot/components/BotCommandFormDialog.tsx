"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { BotCommandRecord } from "@services/entities/bot-commands.services";

const commandFormSchema = z.object({
  trigger: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(33)
    .regex(
      /^!?[a-zA-Z0-9_]+$/,
      "Use letras, números e underscore (sem espaços)"
    ),
  response: z.string().min(1, "Resposta obrigatória").max(500),
  cooldownSeconds: z.coerce.number().int().min(0).max(3600),
  enabled: z.boolean(),
});

type CommandFormValues = z.infer<typeof commandFormSchema>;

interface BotCommandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BotCommandRecord | null;
  submitting: boolean;
  onSubmit: (values: CommandFormValues) => Promise<boolean>;
}

const VARIABLES_HELP = "{user}, {displayName}, {channel}, {count:nome}";

export function BotCommandFormDialog({
  open,
  onOpenChange,
  editing,
  submitting,
  onSubmit,
}: BotCommandFormDialogProps) {
  const form = useForm<CommandFormValues>({
    resolver: zodResolver(commandFormSchema),
    defaultValues: {
      trigger: "",
      response: "",
      cooldownSeconds: 0,
      enabled: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        trigger: editing.trigger,
        response: editing.response,
        cooldownSeconds: editing.cooldownSeconds,
        enabled: editing.enabled,
      });
    } else {
      form.reset({
        trigger: "",
        response: "",
        cooldownSeconds: 0,
        enabled: true,
      });
    }
  }, [open, editing, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = await onSubmit(values);
    if (ok) onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar comando" : "Novo comando"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger</Label>
            <Input
              id="trigger"
              placeholder="!discord"
              {...form.register("trigger")}
            />
            {form.formState.errors.trigger && (
              <p className="text-body-sm text-destructive">
                {form.formState.errors.trigger.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">Resposta</Label>
            <Textarea
              id="response"
              rows={4}
              placeholder="Entre no nosso Discord: ..."
              {...form.register("response")}
            />
            <p className="text-body-sm text-muted-foreground">
              Variáveis: {VARIABLES_HELP} · máx. 500 caracteres (
              {form.watch("response")?.length ?? 0}/500)
            </p>
            {form.formState.errors.response && (
              <p className="text-body-sm text-destructive">
                {form.formState.errors.response.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldown">Cooldown (segundos)</Label>
            <Input
              id="cooldown"
              type="number"
              min={0}
              max={3600}
              {...form.register("cooldownSeconds")}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-outline-variant/30 px-3 py-2">
            <Label htmlFor="enabled">Comando ativo</Label>
            <Switch
              id="enabled"
              checked={form.watch("enabled")}
              onCheckedChange={(checked) => form.setValue("enabled", checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !form.formState.isValid}>
              {submitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
