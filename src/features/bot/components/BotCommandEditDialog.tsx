"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Loader2, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BotMessageComposer } from "@features/bot/components/BotMessageComposer";
import {
  canEditCommandResponse,
  getCommandCategoryShort,
  type BotCommandRowState,
} from "@features/bot/types/bot-command.types";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";

interface BotCommandEditDialogProps {
  open: boolean;
  command: BotCommandRowState | null;
  variables: BotVariableItem[];
  emotes: TwitchChannelEmote[];
  emotesLoading?: boolean;
  saving?: boolean;
  saveError?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<BotCommandRowState>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const TRIGGER_MAX_LENGTH = 20;

function cooldownToDisplay(seconds: number, unit: "seconds" | "minutes") {
  if (unit === "minutes") return seconds >= 60 ? Math.round(seconds / 60) : 0;
  return seconds;
}

function displayToCooldown(value: number, unit: "seconds" | "minutes") {
  return unit === "minutes" ? value * 60 : value;
}

function validateTrigger(trigger: string): string | null {
  if (!trigger.startsWith("!")) {
    return "Comandos devem começar com !";
  }
  if (/\s/.test(trigger)) {
    return "Comandos não podem conter espaços";
  }
  if (trigger.length > TRIGGER_MAX_LENGTH) {
    return `Máximo de ${TRIGGER_MAX_LENGTH} caracteres`;
  }
  return null;
}

export function BotCommandEditDialog({
  open,
  command,
  variables,
  emotes,
  emotesLoading,
  saving = false,
  saveError = false,
  onOpenChange,
  onChange,
  onSave,
  onCancel,
  onDelete,
}: BotCommandEditDialogProps) {
  const [cooldownUnit, setCooldownUnit] = useState<"seconds" | "minutes">("seconds");

  useEffect(() => {
    if (!command) return;
    setCooldownUnit(
      command.cooldownSeconds > 0 && command.cooldownSeconds % 60 === 0
        ? "minutes"
        : "seconds"
    );
  }, [command?.id, command?.cooldownSeconds]);

  const triggerError = useMemo(() => {
    if (!command || command.isBuiltin) return null;
    return validateTrigger(command.trigger);
  }, [command]);

  if (!command) return null;

  const isCustom = !command.isBuiltin;
  const canEditResponse = canEditCommandResponse(command);
  const isNew = command.isDraft || command.isNew;
  const cooldownDisplay = cooldownToDisplay(command.cooldownSeconds, cooldownUnit);
  const categoryLabel = getCommandCategoryShort(command);

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleSave = () => {
    if (isCustom && triggerError) return;
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl p-0 duration-100 [&>button.absolute]:hidden">
        <DialogHeader className="border-b border-border/40 px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold">
                {isNew ? "Novo comando" : `Editar ${command.trigger}`}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {command.isBuiltin ? "Comando padrão" : "Comando personalizado"} ·{" "}
                {categoryLabel}
              </p>
            </div>
            <DialogClose
              className="rounded-md p-1 transition-colors hover:bg-muted"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
        </DialogHeader>

        {command.isBuiltin ? (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3.5 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
            <p className="text-xs leading-relaxed text-purple-300">
              Comando padrão — apenas a resposta pode ser editada.
            </p>
          </div>
        ) : null}

        {command.description ? (
          <p className="px-6 pt-4 text-xs text-muted-foreground">{command.description}</p>
        ) : null}

        <div className="space-y-4 px-6 pb-2 pt-4">
          {isCustom ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comando
              </Label>
              <Input
                value={command.trigger}
                disabled={saving}
                maxLength={TRIGGER_MAX_LENGTH}
                onChange={(event) =>
                  onChange({
                    trigger: event.target.value.replace(/\s/g, "").slice(0, TRIGGER_MAX_LENGTH),
                  })
                }
                placeholder="!meucomando"
                className="font-mono"
              />
              {triggerError ? (
                <p className="text-xs text-destructive/80">{triggerError}</p>
              ) : null}
            </div>
          ) : null}

          {canEditResponse ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resposta
              </Label>
              <BotMessageComposer
                value={command.response}
                onChange={(response) => onChange({ response })}
                variables={variables}
                emotes={emotes}
                emotesLoading={emotesLoading}
                disabled={saving}
                placeholder="Digite a resposta do comando..."
                maxLength={500}
                variant="compact"
              />
            </div>
          ) : command.responseTemplate ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resposta
              </Label>
              <p className="rounded-md bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
                {command.responseTemplate}
              </p>
              <p className="text-xs text-muted-foreground">
                Texto montado automaticamente pelo bot com dados da live.
              </p>
            </div>
          ) : null}

          {isCustom ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cooldown
              </Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={cooldownUnit === "minutes" ? 60 : 3600}
                  value={cooldownDisplay}
                  disabled={saving}
                  onChange={(event) => {
                    const raw = parseInt(event.target.value, 10) || 0;
                    onChange({
                      cooldownSeconds: displayToCooldown(raw, cooldownUnit),
                    });
                  }}
                  className="w-16 text-center tabular-nums"
                />
                <Select
                  value={cooldownUnit}
                  disabled={saving}
                  onValueChange={(value: "seconds" | "minutes") => {
                    setCooldownUnit(value);
                    const current = cooldownToDisplay(command.cooldownSeconds, value);
                    onChange({
                      cooldownSeconds: displayToCooldown(current, value),
                    });
                  }}
                >
                  <SelectTrigger className="w-28 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">segundos</SelectItem>
                    <SelectItem value="minutes">minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {command.runtimeNotes ? (
            <p className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {command.runtimeNotes}
            </p>
          ) : null}

          {isCustom && onDelete && !isNew ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir comando
            </Button>
          ) : null}
        </div>

        {saveError ? (
          <p className="px-6 pb-1 text-xs text-destructive/80">
            Não foi possível salvar. Tente novamente.
          </p>
        ) : null}

        <DialogFooter className="mt-2 border-t border-border/40 px-6 py-4 sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            disabled={saving || Boolean(isCustom && triggerError)}
            onClick={handleSave}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar comando"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
