"use client";

import { Info } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/shared/AdminConfigSection";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSaveFooter } from "@/components/admin/shared/AdminSaveFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getMultiplierHint } from "@features/economy/utils/multiplier-hint";
import { useEconomyPointsPage } from "@features/economy/hooks/use-economy-points-page.hook";
import { EconomyPointsBlocklistSection } from "@features/economy/components/EconomyPointsBlocklistSection";

const MULTIPLIER_FIELDS = [
  {
    key: "subscriberMultiplier" as const,
    label: "Inscritos",
    role: "subscriber" as const,
  },
  { key: "vipMultiplier" as const, label: "VIPs", role: "vip" as const },
  {
    key: "moderatorMultiplier" as const,
    label: "Moderadores",
    role: "moderator" as const,
  },
];

export default function EconomyPointsPage() {
  const {
    form,
    setForm,
    pointsEnabled,
    setPointsEnabled,
    publicRanking,
    setPublicRanking,
    loading,
    saving,
    isDirty,
    savedRecently,
    previewSummary,
    saveAll,
  } = useEconomyPointsPage();

  if (loading) {
    return (
      <div className="admin-page-stack">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="admin-page-stack pb-20">
      <AdminPageHeader
        title="Sistema de Pontos"
        description="Configure como seus viewers ganham pontos gratuitos durante a live."
      />

      <div className="points-rules-summary" role="status" aria-live="polite">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>{previewSummary}</p>
      </div>

      <div className="admin-config-stack">
        <AdminConfigSection title="Ativação" showDivider={false}>
          <div className="admin-subsection-stack">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="points-enabled">Distribuir pontos</Label>
                <p className="text-caption">
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
                <p className="text-caption">
                  Permite que comandos como !rank mostrem o top do canal.
                </p>
              </div>
              <Switch
                id="public-ranking"
                checked={publicRanking}
                onCheckedChange={setPublicRanking}
              />
            </div>
          </div>
        </AdminConfigSection>

        <AdminConfigSection
          title="Ganhos por tempo na live"
          description="Defina quantos pontos o viewer recebe e com que frequência."
        >
          <div className="grid gap-5 md:grid-cols-2">
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
              <Label htmlFor="min-messages">Mensagens mínimas no intervalo</Label>
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
              <p className="text-caption">
                <strong>0</strong> = modo passivo (StreamElements): pontos para quem
                está na lista de chatters — o bot precisa ser moderador com escopo{" "}
                <code className="text-caption">moderator:read:chatters</code>.
                <strong className="ml-1">1 ou mais</strong> = modo ativo: o viewer
                precisa enviar mensagens normais no intervalo.
              </p>
            </div>
          </div>
        </AdminConfigSection>

        <AdminConfigSection
          title="Multiplicadores"
          description="Bônus para grupos especiais do chat."
        >
          <div className="admin-subsection-stack">
            {MULTIPLIER_FIELDS.map(({ key, label, role }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>{label}</Label>
                  <span className="text-[15px] font-semibold text-primary">
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
                <p className="text-caption">
                  {getMultiplierHint(form[key], role)}
                </p>
              </div>
            ))}
          </div>
        </AdminConfigSection>

        <AdminConfigSection title="Limite diário">
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
        </AdminConfigSection>

        <EconomyPointsBlocklistSection />

        <AdminConfigSection title="Mensagem no chat">
          <div className="admin-subsection-stack">
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
            <p className="text-caption">
              Variáveis: {"{displayName}"}, {"{points}"}, {"{totalPoints}"}
            </p>
          </div>
        </AdminConfigSection>
      </div>

      <AdminSaveFooter
        dirty={isDirty}
        saving={saving}
        saved={savedRecently}
        onSave={() => void saveAll()}
      />
    </div>
  );
}
