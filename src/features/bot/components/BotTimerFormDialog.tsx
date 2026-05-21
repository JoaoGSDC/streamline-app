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
import type { BotTimerRecord } from "@services/entities/bot-timers.services";

const timerFormSchema = z.object({
  name: z.string().max(64).optional(),
  intervalMinutes: z.coerce.number().int().min(1).max(120),
  message: z.string().min(1).max(500),
  enabled: z.boolean(),
});

type TimerFormValues = z.infer<typeof timerFormSchema>;

interface BotTimerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BotTimerRecord | null;
  submitting: boolean;
  onSubmit: (values: {
    name?: string | null;
    intervalMinutes: number;
    message: string;
    enabled: boolean;
  }) => Promise<boolean>;
}

export function BotTimerFormDialog({
  open,
  onOpenChange,
  editing,
  submitting,
  onSubmit,
}: BotTimerFormDialogProps) {
  const form = useForm<TimerFormValues>({
    resolver: zodResolver(timerFormSchema),
    defaultValues: {
      name: "",
      intervalMinutes: 5,
      message: "",
      enabled: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name ?? "",
        intervalMinutes: editing.intervalMinutes,
        message: editing.message,
        enabled: editing.enabled,
      });
    } else {
      form.reset({
        name: "",
        intervalMinutes: 5,
        message: "",
        enabled: true,
      });
    }
  }, [open, editing, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = await onSubmit({
      ...values,
      name: values.name?.trim() || undefined,
    });
    if (ok) onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar timer" : "Novo timer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timer-name">Nome (opcional)</Label>
            <Input id="timer-name" {...form.register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo (minutos)</Label>
            <Input
              id="interval"
              type="number"
              min={1}
              max={120}
              {...form.register("intervalMinutes")}
            />
            {form.formState.errors.intervalMinutes && (
              <p className="text-body-sm text-destructive">
                {form.formState.errors.intervalMinutes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timer-message">Mensagem</Label>
            <Textarea
              id="timer-message"
              rows={3}
              {...form.register("message")}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-outline-variant/30 px-3 py-2">
            <Label htmlFor="timer-enabled">Timer ativo</Label>
            <Switch
              id="timer-enabled"
              checked={form.watch("enabled")}
              onCheckedChange={(checked) => form.setValue("enabled", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
