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
import {
  formatLiveTimerPreview,
  BOT_TIMER_SCHEDULE_LABELS,
} from "@lib/bot-timer-schedule";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";

import type { BotTimerRowState } from "@features/bot/types/bot-timer.types";

export type { BotTimerRowState };

interface BotTimerAccordionRowProps {
  timer: BotTimerRowState;
  variables: BotVariableItem[];
  emotes: TwitchChannelEmote[];
  emotesLoading?: boolean;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  onChange: (patch: Partial<BotTimerRowState>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

export function BotTimerAccordionRow({
  timer,
  variables,
  emotes,
  emotesLoading,
  saving = false,
  hasUnsavedChanges = false,
  onChange,
  onSave,
  onDelete,
  onToggleEnabled,
}: BotTimerAccordionRowProps) {
  const schedulePreview = formatLiveTimerPreview(
    timer.intervalMinutes,
    timer.firstRunAfterMinutes
  );

  return (
    <AccordionItem
      value={timer.id}
      className="overflow-hidden rounded-lg border border-outline-variant/30 px-3"
    >
      <div className="flex min-w-0 items-center gap-2 py-1">
        <AccordionTrigger className="min-w-0 flex-1 gap-2 overflow-hidden py-3 hover:no-underline">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                {timer.name.trim() || "Timer sem nome"}
              </span>
              <span className="text-caption">
                a cada {timer.intervalMinutes} min
              </span>
              {timer.isDraft ? (
                <Badge variant="draft">Rascunho</Badge>
              ) : !timer.enabled ? (
                <Badge variant="inactive">Inativo</Badge>
              ) : null}
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
            {timer.message ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-body-sm text-muted-foreground">
                    {timer.message}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm break-words">
                  {timer.message}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-body-sm text-muted-foreground">
                Sem mensagem
              </span>
            )}
          </div>
        </AccordionTrigger>
        <Switch
          checked={timer.enabled}
          onCheckedChange={onToggleEnabled}
          aria-label={`Ativar timer ${timer.name || timer.id}`}
          className="shrink-0"
        />
      </div>

      <AccordionContent className="space-y-4 pb-4">
        <p className="text-body-sm text-muted-foreground">
          {BOT_TIMER_SCHEDULE_LABELS.live_elapsed}. Exemplo com live às 21:00:{" "}
          <strong className="font-medium text-foreground">{schedulePreview}</strong>
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor={`timer-name-${timer.id}`}>Nome (opcional)</Label>
            <Input
              id={`timer-name-${timer.id}`}
              value={timer.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Ex.: Lembrete PIX"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`timer-interval-${timer.id}`}>
              Repetir a cada (min)
            </Label>
            <Input
              id={`timer-interval-${timer.id}`}
              type="number"
              min={1}
              max={120}
              value={timer.intervalMinutes}
              onChange={(event) => {
                const intervalMinutes =
                  parseInt(event.target.value, 10) || 1;
                onChange({ intervalMinutes });
              }}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`timer-first-${timer.id}`}>
              Primeira após (min)
            </Label>
            <Input
              id={`timer-first-${timer.id}`}
              type="number"
              min={1}
              max={120}
              value={timer.firstRunAfterMinutes}
              onChange={(event) => {
                const firstRunAfterMinutes =
                  parseInt(event.target.value, 10) || 1;
                onChange({ firstRunAfterMinutes });
              }}
              disabled={saving}
            />
            <p className="text-body-xs text-muted-foreground">
              Minutos após o início da live. Use o mesmo valor do intervalo para
              21:05, 21:10… (live 21:00, a cada 5 min).
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mensagem no chat</Label>
          <BotMessageComposer
            value={timer.message}
            onChange={(message) => onChange({ message })}
            variables={variables}
            emotes={emotes}
            emotesLoading={emotesLoading}
            disabled={saving}
            onSave={onSave}
            saving={saving}
            placeholder="Ex.: Apoie o canal! !pix"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {onDelete && (
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
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
