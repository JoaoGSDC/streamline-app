"use client";

import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminAdvancedSection } from "@/components/admin/shared/AdminAdvancedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotMessageComposer } from "@features/bot/components/BotMessageComposer";
import {
  formatLiveTimerPreview,
  BOT_TIMER_SCHEDULE_LABELS,
} from "@lib/bot-timer-schedule";
import type { BotTimerRowState } from "@features/bot/types/bot-timer.types";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";

interface BotTimerEditDrawerProps {
  open: boolean;
  timer: BotTimerRowState | null;
  variables: BotVariableItem[];
  emotes: TwitchChannelEmote[];
  emotesLoading?: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<BotTimerRowState>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function BotTimerEditDrawer({
  open,
  timer,
  variables,
  emotes,
  emotesLoading,
  saving = false,
  onOpenChange,
  onChange,
  onSave,
  onCancel,
}: BotTimerEditDrawerProps) {
  if (!timer) return null;

  const isNew = timer.isDraft || timer.isNew;
  const schedulePreview = formatLiveTimerPreview(
    timer.intervalMinutes,
    timer.firstRunAfterMinutes
  );

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const adjustInterval = (delta: number) => {
    const next = Math.min(120, Math.max(1, timer.intervalMinutes + delta));
    onChange({ intervalMinutes: next });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[480px] max-w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="border-b border-outline-variant/20 px-6 py-5 text-left">
          <SheetTitle className="text-section-title">
            {isNew ? "Novo timer" : `Editar ${timer.name.trim() || "timer"}`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="timer-name">Nome do timer (opcional)</Label>
            <Input
              id="timer-name"
              value={timer.name}
              disabled={saving}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Ex.: Lembrete PIX"
            />
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <BotMessageComposer
              value={timer.message}
              onChange={(message) => onChange({ message })}
              variables={variables}
              emotes={emotes}
              emotesLoading={emotesLoading}
              disabled={saving}
              placeholder="Ex.: Apoie o canal! !pix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timer-interval">Intervalo (minutos)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={saving || timer.intervalMinutes <= 1}
                onClick={() => adjustInterval(-1)}
                aria-label="Diminuir intervalo"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="timer-interval"
                type="number"
                min={1}
                max={120}
                value={timer.intervalMinutes}
                disabled={saving}
                onChange={(event) => {
                  const intervalMinutes = parseInt(event.target.value, 10) || 1;
                  onChange({
                    intervalMinutes: Math.min(120, Math.max(1, intervalMinutes)),
                  });
                }}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={saving || timer.intervalMinutes >= 120}
                onClick={() => adjustInterval(1)}
                aria-label="Aumentar intervalo"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AdminAdvancedSection summary="Opções avançadas">
            <div className="admin-subsection-stack">
              <div className="space-y-2">
                <Label htmlFor="timer-first-run">Primeira mensagem após (min)</Label>
                <Input
                  id="timer-first-run"
                  type="number"
                  min={1}
                  max={120}
                  value={timer.firstRunAfterMinutes}
                  disabled={saving}
                  onChange={(event) => {
                    const firstRunAfterMinutes =
                      parseInt(event.target.value, 10) || 1;
                    onChange({
                      firstRunAfterMinutes: Math.min(
                        120,
                        Math.max(1, firstRunAfterMinutes)
                      ),
                    });
                  }}
                />
                <p className="text-caption">
                  {BOT_TIMER_SCHEDULE_LABELS.live_elapsed}. Exemplo: live às 21:00 →{" "}
                  <strong className="font-medium text-foreground">{schedulePreview}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timer-min-viewers">
                  Mínimo de espectadores (opcional)
                </Label>
                <Input
                  id="timer-min-viewers"
                  type="number"
                  min={0}
                  placeholder="Sem mínimo"
                  value={timer.minViewers ?? ""}
                  disabled={saving}
                  onChange={(event) => {
                    const raw = event.target.value;
                    onChange({
                      minViewers: raw ? Math.max(0, parseInt(raw, 10) || 0) : null,
                    });
                  }}
                />
                <p className="text-caption">
                  O timer só dispara quando houver pelo menos este número de viewers na live.
                </p>
              </div>
            </div>
          </AdminAdvancedSection>
        </div>

        <SheetFooter className="mt-auto border-t border-outline-variant/20 px-6 py-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar timer"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
