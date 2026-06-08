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
import { services } from "@services";
import {
  canEditCommandResponse,
  getCommandCategoryShort,
  type BotCommandRowState,
} from "@features/bot/types/bot-command.types";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";
import { AdvancedSection } from "@features/bot/components/bot-command-edit/AdvancedSection";
import { BasicSection } from "@features/bot/components/bot-command-edit/BasicSection";
import { MultipleResponsesSection } from "@features/bot/components/bot-command-edit/MultipleResponsesSection";
import { PermissionSection } from "@features/bot/components/bot-command-edit/PermissionSection";
import { UsageLimitsSection } from "@features/bot/components/bot-command-edit/UsageLimitsSection";
import { validateTrigger } from "@features/bot/components/bot-command-edit/command-form.utils";

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

function BuiltinNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3.5 py-2.5">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
      <p className="text-xs leading-relaxed text-purple-300">
        Comando padrão — apenas a resposta pode ser editada.
      </p>
    </div>
  );
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
  const [lastUsedLabel, setLastUsedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !command || command.isDraft || command.isNew) {
      setLastUsedLabel(null);
      return;
    }

    let cancelled = false;
    void services.botCommands
      .getUsage(command.id, "month")
      .then((stats) => {
        if (cancelled || stats.totalUses === 0) return;
        const top = stats.topUsers[0];
        if (top) {
          setLastUsedLabel(`@${top.login} usou ${top.count}x este mês`);
        }
      })
      .catch(() => {
        if (!cancelled) setLastUsedLabel(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, command?.id, command?.isDraft, command?.isNew]);

  const triggerError = useMemo(() => {
    if (!command || command.isBuiltin) return null;
    return validateTrigger(command.trigger);
  }, [command]);

  if (!command) return null;

  const isBuiltin = command.isBuiltin;
  const isCustom = !isBuiltin;
  const isNew = command.isDraft || command.isNew;
  const canEditResponse = canEditCommandResponse(command);
  const categoryLabel = getCommandCategoryShort(command);

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleSave = () => {
    if (isCustom && triggerError) return;
    if (!canEditResponse && isBuiltin) return;
    onSave();
  };

  const formBinding = {
    command,
    onChange,
    disabled: saving,
    triggerError,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-xl p-0 duration-100 [&>button.absolute]:hidden">
        <DialogHeader className="shrink-0 border-b border-border/40 px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-mono text-base font-semibold">
                {isNew
                  ? "Novo comando"
                  : isBuiltin
                    ? command.trigger
                    : `Editar ${command.trigger}`}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isBuiltin ? "Comando padrão" : "Comando personalizado"} ·{" "}
                {categoryLabel}
              </p>
              {command.useCount > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {command.useCount.toLocaleString("pt-BR")} usos totais
                  {lastUsedLabel ? ` · ${lastUsedLabel}` : ""}
                </p>
              ) : null}
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

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isBuiltin ? <BuiltinNotice /> : null}

          {command.description ? (
            <p className="text-xs text-muted-foreground">{command.description}</p>
          ) : null}

          <BasicSection
            {...formBinding}
            isBuiltin={isBuiltin}
            variables={variables}
            emotes={emotes}
            emotesLoading={emotesLoading}
          />

          {isCustom ? <MultipleResponsesSection {...formBinding} /> : null}

          <PermissionSection {...formBinding} isBuiltin={isBuiltin} />

          <UsageLimitsSection {...formBinding} isBuiltin={isBuiltin} />

          <AdvancedSection {...formBinding} isBuiltin={isBuiltin} />

          {command.runtimeNotes ? (
            <p className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {command.runtimeNotes}
            </p>
          ) : null}
        </div>

        {saveError ? (
          <p className="px-6 pb-1 text-xs text-destructive/80">
            Não foi possível salvar. Tente novamente.
          </p>
        ) : null}

        <DialogFooter className="shrink-0 border-t border-border/40 px-6 py-4 sm:justify-end">
          {isCustom && onDelete && !isNew ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mr-auto text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Excluir
            </Button>
          ) : null}
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
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
