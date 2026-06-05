"use client";

import { Info } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEconomyPointsPage } from "@features/economy/hooks/use-economy-points-page.hook";

function SectionSaveButton({
  onClick,
  saving,
  label = "Salvar seção",
}: {
  onClick: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <div className="flex justify-end border-t border-outline-variant/20 pt-4">
      <Button size="sm" onClick={onClick} disabled={saving}>
        {saving ? "Salvando…" : label}
      </Button>
    </div>
  );
}

export default function EconomyPointsPage() {
  const {
    form,
    setForm,
    pointsEnabled,
    setPointsEnabled,
    publicRanking,
    setPublicRanking,
    loading,
    isSaving,
    previewSummary,
    saveActivation,
    saveWatchTime,
    saveMultipliers,
    saveDailyCap,
    saveEarnMessage,
  } = useEconomyPointsPage();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <AdminPageHeader
          title="Sistema de Pontos"
          description="Configure como seus viewers ganham pontos gratuitos durante a live. Cada seção tem seu próprio botão Salvar."
        />

        <AdminSection title="Ativação">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="points-enabled">Distribuir pontos</Label>
                <p className="text-body-sm text-muted-foreground">
                  Quando desligado, ninguém ganha pontos automaticamente.
                </p>
              </div>
              <Switch
                id="points-enabled"
                checked={pointsEnabled}
                onCheckedChange={setPointsEnabled}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="public-ranking">Ranking público</Label>
                <p className="text-body-sm text-muted-foreground">
                  Permite que comandos como !rank mostrem o top do canal.
                </p>
              </div>
              <Switch
                id="public-ranking"
                checked={publicRanking}
                onCheckedChange={setPublicRanking}
              />
            </div>
            <SectionSaveButton
              onClick={() => void saveActivation()}
              saving={isSaving("activation")}
              label="Salvar ativação"
            />
          </div>
        </AdminSection>

        <AdminSection
          title="Ganhos por tempo na live"
          description="Defina quantos pontos o viewer recebe e com que frequência."
        >
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="points-per-interval">Pontos por intervalo</Label>
                <Input
                  id="points-per-interval"
                  type="number"
                  min={1}
                  value={form.pointsPerInterval}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pointsPerInterval: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval-minutes">Intervalo (minutos)</Label>
                <Input
                  id="interval-minutes"
                  type="number"
                  min={1}
                  value={form.intervalMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      intervalMinutes: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="min-messages">
                  Mensagens mínimas no intervalo
                </Label>
                <Input
                  id="min-messages"
                  type="number"
                  min={0}
                  value={form.minMessagesPerInterval}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minMessagesPerInterval: Number(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-body-xs text-muted-foreground">
                  <strong>0</strong> = modo passivo (StreamElements): pontos para quem
                  está na lista de chatters — o bot precisa ser moderador com escopo{" "}
                  <code className="text-body-xs">moderator:read:chatters</code>.
                  <strong className="ml-1">1 ou mais</strong> = modo ativo: o viewer
                  precisa enviar mensagens normais no intervalo.
                </p>
              </div>
            </div>
            <SectionSaveButton
              onClick={() => void saveWatchTime()}
              saving={isSaving("watchTime")}
            />
          </div>
        </AdminSection>

        <AdminSection title="Multiplicadores" description="Bônus para grupos especiais do chat.">
          <div className="space-y-6">
            {(
              [
                ["subscriberMultiplier", "Inscritos", "2x típico para subs"],
                ["vipMultiplier", "VIPs", "Recompense seus VIPs"],
                ["moderatorMultiplier", "Moderadores", "Opcional — padrão 1x"],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>{label}</Label>
                  <span className="font-mono text-body-sm">
                    {form[key].toFixed(1)}x
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={[form[key]]}
                  onValueChange={([value]) =>
                    setForm((f) => ({ ...f, [key]: value }))
                  }
                />
                <p className="text-body-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
            <SectionSaveButton
              onClick={() => void saveMultipliers()}
              saving={isSaving("multipliers")}
            />
          </div>
        </AdminSection>

        <AdminSection title="Limite diário">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="daily-cap">Máximo de pontos por dia (opcional)</Label>
              <Input
                id="daily-cap"
                type="number"
                min={1}
                placeholder="Sem limite"
                value={form.dailyPointsCap ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dailyPointsCap: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <SectionSaveButton
              onClick={() => void saveDailyCap()}
              saving={isSaving("dailyCap")}
            />
          </div>
        </AdminSection>

        <AdminSection title="Mensagem ao ganhar pontos">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="earn-message">Enviar mensagem no chat</Label>
              <Switch
                id="earn-message"
                checked={form.earnMessageEnabled}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, earnMessageEnabled: checked }))
                }
              />
            </div>
            <Textarea
              rows={2}
              disabled={!form.earnMessageEnabled}
              value={form.earnMessageTemplate ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  earnMessageTemplate: e.target.value,
                }))
              }
              placeholder="{displayName} ganhou {points} pontos!"
            />
            <p className="text-body-xs text-muted-foreground">
              Variáveis: {"{displayName}"}, {"{points}"}, {"{totalPoints}"}
            </p>
            <SectionSaveButton
              onClick={() => void saveEarnMessage()}
              saving={isSaving("earnMessage")}
            />
          </div>
        </AdminSection>

        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-container/10 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-medium text-foreground">Resumo das regras</p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {previewSummary}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="sr-only">Ajuda</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Este texto é atualizado em tempo real conforme você altera os
              campos acima.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
