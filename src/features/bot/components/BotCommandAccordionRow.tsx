"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminTypeDot } from "@/components/admin/shared/AdminTypeDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BotMessageComposer } from "@features/bot/components/BotMessageComposer";
import type { BotCommandRowState } from "@features/bot/types/bot-command.types";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";

export type { BotCommandRowState };

interface BotCommandAccordionRowProps {
  command: BotCommandRowState;
  variables: BotVariableItem[];
  emotes: TwitchChannelEmote[];
  emotesLoading?: boolean;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  onChange: (patch: Partial<BotCommandRowState>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

export function BotCommandAccordionRow({
  command,
  variables,
  emotes,
  emotesLoading,
  saving = false,
  hasUnsavedChanges = false,
  onChange,
  onSave,
  onDelete,
  onToggleEnabled,
}: BotCommandAccordionRowProps) {
  const isCustom = !command.isBuiltin;
  const roleLabel =
    command.minRole === "moderator"
      ? "Mod"
      : command.minRole === "streamer"
        ? "Streamer"
        : null;

  const previewText =
    command.response.trim() ||
    command.responseTemplate?.trim() ||
    "";

  return (
    <AccordionItem
      value={command.id}
      className="overflow-hidden rounded-lg border border-outline-variant/30 px-3"
    >
      <div className="flex min-w-0 items-center gap-2 py-1">
        <AccordionTrigger className="min-w-0 flex-1 gap-2 overflow-hidden py-3 hover:no-underline">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-body-admin font-medium">
                {command.trigger || "novo_comando"}
              </code>
              <AdminTypeDot type={command.isBuiltin ? "builtin" : "custom"} />
              {roleLabel && (
                <span className="text-caption">{roleLabel}</span>
              )}
              {command.argsHint && (
                <span className="hidden max-w-[8rem] truncate font-mono text-caption lg:inline">
                  {command.argsHint}
                </span>
              )}
              {command.isDraft && (
                <Badge variant="draft">Rascunho</Badge>
              )}
              {hasUnsavedChanges && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex shrink-0 text-amber-500"
                      role="img"
                      aria-label="Não salvo"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Não salvo</TooltipContent>
                </Tooltip>
              )}
            </div>
            {previewText ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-body-sm text-muted-foreground">
                    {previewText}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm break-words">
                  {previewText}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </AccordionTrigger>
        <Switch
          checked={command.enabled}
          onCheckedChange={onToggleEnabled}
          aria-label={`Ativar ${command.trigger}`}
          className="shrink-0"
        />
      </div>

      <AccordionContent className="space-y-4 pb-4">
        {command.description && (
          <p className="text-body-sm text-muted-foreground">{command.description}</p>
        )}
        {command.runtimeNotes && (
          <p className="rounded-md border border-outline-variant/30 bg-muted/30 px-3 py-2 text-body-xs text-muted-foreground">
            {command.runtimeNotes}
          </p>
        )}
        {command.externalApiUrlTemplate && (
          <p className="font-mono text-body-xs text-muted-foreground break-all">
            API: {command.externalApiUrlTemplate}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`trigger-${command.id}`}>Trigger</Label>
              <Input
                id={`trigger-${command.id}`}
                value={command.trigger}
                onChange={(event) =>
                  onChange({ trigger: event.target.value.replace(/\s/g, "") })
                }
                placeholder="!meucomando"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cooldown-${command.id}`}>Cooldown (s)</Label>
              <Input
                id={`cooldown-${command.id}`}
                type="number"
                min={0}
                max={3600}
                value={command.cooldownSeconds}
                onChange={(event) =>
                  onChange({
                    cooldownSeconds: parseInt(event.target.value, 10) || 0,
                  })
                }
              />
            </div>
        </div>

        <div className="space-y-2">
          <Label>Mensagem de resposta</Label>
          <BotMessageComposer
            value={command.response}
            onChange={(response) => onChange({ response })}
            variables={variables}
            emotes={emotes}
            emotesLoading={emotesLoading}
            disabled={saving}
            onSave={onSave}
            saving={saving}
          />
          {command.responseTemplate && !command.response.trim() ? (
            <p className="text-body-xs text-muted-foreground">
              Modelo padrão: {command.responseTemplate}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {isCustom && onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
          {command.isBuiltin && (
            <p className="text-body-sm text-muted-foreground">
              Comando padrão — não pode ser excluído, apenas desativado.
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
