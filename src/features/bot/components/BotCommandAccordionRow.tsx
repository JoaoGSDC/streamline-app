"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";

export interface BotCommandRowState {
  id: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
  isBuiltin: boolean;
  builtinKey?: string | null;
  description?: string;
  category?: string;
  categoryLabel?: string;
  minRole?: "everyone" | "moderator" | "streamer";
  argsHint?: string | null;
  customizableResponse?: boolean;
  responseTemplate?: string | null;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string | null;
  runtimeNotes?: string | null;
  externalApiUrlTemplate?: string | null;
  isDraft?: boolean;
  isNew?: boolean;
}

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
  const canEditResponse = isCustom || command.customizableResponse !== false;
  const roleLabel =
    command.minRole === "moderator"
      ? "Mod"
      : command.minRole === "streamer"
        ? "Streamer"
        : null;

  return (
    <AccordionItem
      value={command.id}
      className="rounded-lg border border-outline-variant/30 px-3"
    >
      <div className="flex items-center gap-2 py-1">
        <AccordionTrigger className="flex-1 py-3 hover:no-underline">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-body-sm font-medium">
              {command.trigger || "novo_comando"}
            </code>
            {command.isBuiltin ? (
              <Badge
                variant="outline"
                className="border-outline-variant/50 bg-transparent shadow-none"
              >
                Padrão
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-outline-variant/50 bg-transparent shadow-none"
              >
                Personalizado
              </Badge>
            )}
            {command.categoryLabel && (
              <Badge
                variant="outline"
                className="hidden border-outline-variant/50 bg-muted/30 shadow-none sm:inline-flex"
              >
                {command.categoryLabel}
              </Badge>
            )}
            {roleLabel && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-transparent text-amber-700 shadow-none dark:text-amber-400"
              >
                {roleLabel}
              </Badge>
            )}
            {command.argsHint && (
              <span className="hidden truncate font-mono text-body-xs text-muted-foreground lg:inline">
                {command.argsHint}
              </span>
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
            {command.isDraft && (
              <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 shadow-none">
                Rascunho
              </Badge>
            )}
            <span className="hidden truncate text-body-sm text-muted-foreground sm:inline">
              {command.response}
            </span>
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

        {isCustom && (
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
        )}

        {canEditResponse ? (
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
          </div>
        ) : command.responseTemplate ? (
          <div className="space-y-2">
            <Label>Mensagem no chat (modelo)</Label>
            <p className="rounded-md border border-outline-variant/30 bg-muted/20 px-3 py-2 font-mono text-body-xs text-muted-foreground">
              {command.responseTemplate}
            </p>
            {command.requiresConfirmation && command.confirmationPrompt && (
              <p className="text-body-xs text-muted-foreground">
                Confirmação: {command.confirmationPrompt}
              </p>
            )}
            <p className="text-body-xs text-muted-foreground">
              Texto montado automaticamente pelo bot com dados da live. Não é
              editável aqui.
            </p>
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground">
            Este comando é executado automaticamente pelo bot. Você pode apenas
            ativá-lo ou desativá-lo.
          </p>
        )}

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
              Comandos padrão não podem ser removidos — apenas desativados
              {canEditResponse ? " ou com mensagem personalizada" : ""}.
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
