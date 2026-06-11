"use client";

import { useMemo, useState } from "react";
import { Info, Lock, Pause, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PresetSelector } from "./PresetSelector";
import { AdvancedOptions } from "./AdvancedOptions";
import type { RaffleConfig, RaffleMode } from "../types";
import type { RaffleCreateInput } from "@services/entities/raffles.services";
import type { RaffleStateActions, RaffleUiState } from "../hooks/useRaffleState";

const DEFAULT_CONFIG: RaffleCreateInput = {
  mode: "keyword",
  keyword: "!sorteio",
  winnerCount: 1,
  maxEntriesPerUser: 1,
  durationSeconds: null,
  pointsCost: 0,
  requireFollower: false,
  minFollowDays: 0,
  requireSub: false,
  allowedSubTiers: ["1", "2", "3"],
  requireVip: false,
  excludeMods: false,
  excludeVips: false,
  requireWinnerConfirmation: false,
  confirmationTimeoutSeconds: 60,
  confirmationKeyword: "sim",
  announceStart: true,
  announceReminders: [120, 60, 30],
  announceWinner: true,
};

const DURATION_OPTIONS = [
  { label: "2 min", value: 120 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "Sem limite", value: null },
];

function LabelWithInfo({ label, hint }: { label: string; hint: string }) {
  return (
    <Label className="flex items-center gap-1 text-xs">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground/70 transition-colors hover:text-muted-foreground"
            aria-label={`Sobre ${label.toLowerCase()}`}
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          {hint}
        </TooltipContent>
      </Tooltip>
    </Label>
  );
}

function ManualEntryInput({
  onAdd,
}: {
  onAdd: (login: string) => void;
}) {
  const [login, setLogin] = useState("");
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] text-muted-foreground">Adicionar manualmente</Label>
      <div className="flex gap-1">
        <Input
          className="h-8 text-xs"
          placeholder="@login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && login.trim()) {
              onAdd(login.trim());
              setLogin("");
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={() => {
            if (login.trim()) {
              onAdd(login.trim());
              setLogin("");
            }
          }}
        >
          <UserPlus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function IdleConfig({ onStart, loading }: { onStart: (c: RaffleCreateInput) => void; loading: boolean }) {
  const [config, setConfig] = useState<RaffleCreateInput>(DEFAULT_CONFIG);

  const patch = (p: Partial<RaffleCreateInput>) => setConfig((c) => ({ ...c, ...p }));

  const onModeChange = (mode: RaffleMode) => {
    const next: Partial<RaffleCreateInput> = { mode };
    if (mode === "sub_only") {
      next.requireSub = true;
      next.requireFollower = false;
      next.requireVip = false;
    } else if (mode === "points") {
      next.pointsCost = next.pointsCost || 100;
    }
    patch(next);
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        <PresetSelector value={config.mode} onChange={onModeChange} />

        {config.mode === "keyword" && (
          <div>
            <Label className="text-xs">Palavra-chave</Label>
            <Input
              className="mt-1 font-mono text-sm"
              value={config.keyword ?? ""}
              onChange={(e) => patch({ keyword: e.target.value })}
            />
          </div>
        )}

        {config.mode === "points" && (
          <div>
            <Label className="text-xs">Custo em pontos</Label>
            <Input
              type="number"
              className="mt-1"
              value={config.pointsCost}
              onChange={(e) => patch({ pointsCost: Number(e.target.value) })}
            />
          </div>
        )}

        {config.mode === "sub_only" && (
          <div>
            <Label className="text-xs">Tiers permitidos</Label>
            <div className="mt-1 flex gap-2">
              {(["1", "2", "3"] as const).map((tier) => (
                <label key={tier} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={config.allowedSubTiers.includes(tier)}
                    onChange={(e) => {
                      const tiers = e.target.checked
                        ? [...config.allowedSubTiers, tier]
                        : config.allowedSubTiers.filter((t) => t !== tier);
                      patch({ allowedSubTiers: tiers.length ? tiers : ["1"] });
                    }}
                  />
                  T{tier}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <LabelWithInfo
            label="Duração"
            hint="Tempo em que o sorteio fica aberto para entradas no chat. Quando acabar, as inscrições fecham automaticamente. Escolha 'Sem limite' para encerrar manualmente pelo botão 'Encerrar entradas'."
          />
          <select
            className="mt-1 w-full rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs"
            value={config.durationSeconds ?? ""}
            onChange={(e) =>
              patch({
                durationSeconds: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Vencedores</Label>
            <Input
              type="number"
              min={1}
              max={10}
              className="mt-1 h-8 text-xs"
              value={config.winnerCount}
              onChange={(e) => patch({ winnerCount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Entradas/usuário</Label>
            <Input
              type="number"
              min={1}
              max={10}
              className="mt-1 h-8 text-xs"
              value={config.maxEntriesPerUser}
              onChange={(e) => patch({ maxEntriesPerUser: Number(e.target.value) })}
            />
          </div>
        </div>

        {!["sub_only", "vip_only", "follower_only"].includes(config.mode) && (
          <div className="space-y-2">
            <Label className="text-xs">Elegibilidade</Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "Todos" },
                { key: "follower", label: "Seguidores" },
                { key: "sub", label: "Inscritos" },
                { key: "vip", label: "VIPs" },
              ].map(({ key, label }) => {
                const active =
                  key === "all"
                    ? !config.requireFollower && !config.requireSub && !config.requireVip
                    : key === "follower"
                      ? config.requireFollower
                      : key === "sub"
                        ? config.requireSub
                        : config.requireVip;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "all") {
                        patch({ requireFollower: false, requireSub: false, requireVip: false });
                      } else if (key === "follower") {
                        patch({ requireFollower: true, requireSub: false, requireVip: false });
                      } else if (key === "sub") {
                        patch({ requireFollower: false, requireSub: true, requireVip: false });
                      } else {
                        patch({ requireFollower: false, requireSub: false, requireVip: true });
                      }
                    }}
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      active
                        ? "bg-purple-500/15 text-purple-300"
                        : "bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {config.requireFollower && (
              <div>
                <LabelWithInfo
                  label="Mínimo de dias seguindo"
                  hint="Só entram viewers que seguem o canal há pelo menos esse número de dias. Use 0 para aceitar qualquer seguidor, mesmo quem acabou de seguir."
                />
                <Input
                  type="number"
                  min={0}
                  className="mt-1 h-8 text-xs"
                  value={config.minFollowDays}
                  onChange={(e) => patch({ minFollowDays: Number(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}

        <AdvancedOptions config={config} onChange={patch} />
      </div>

      <div className="sticky bottom-0 border-t border-border/30 bg-background p-4 pt-0">
        <Button
          className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
          disabled={loading}
          onClick={() => onStart(config)}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Iniciar sorteio
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
}

function ActiveConfig({
  raffle,
  onPause,
  onClose,
  onAddEntry,
}: {
  raffle: RaffleConfig;
  onPause: () => void;
  onClose: () => void;
  onAddEntry: (login: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
        <div className="mb-1 text-xs text-muted-foreground">
          {raffle.mode === "keyword" ? "palavra-chave" : raffle.eligibilityLabel}
        </div>
        {raffle.keyword && (
          <div className="font-mono text-base font-semibold text-purple-400">{raffle.keyword}</div>
        )}
        <div className="mt-2 text-xs text-muted-foreground">
          {raffle.eligibilityLabel} · {raffle.winnerCount} vencedor(es)
        </div>
      </div>

      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onPause}>
          <Pause className="mr-1.5 h-3.5 w-3.5" />
          {raffle.status === "paused" ? "Retomar" : "Pausar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-destructive/30 text-destructive"
          onClick={onClose}
        >
          <Lock className="mr-1.5 h-3.5 w-3.5" />
          Encerrar entradas
        </Button>
      </div>

      <ManualEntryInput onAdd={onAddEntry} />
    </div>
  );
}

export function RaffleConfigPanel({
  raffle,
  state,
  actions,
}: {
  raffle: RaffleConfig | null;
  state: RaffleUiState;
  actions: RaffleStateActions;
}) {
  const isIdle = !raffle || raffle.status === "draft" || raffle.status === "cancelled";

  const isActivePhase = useMemo(
    () =>
      raffle &&
      ["active", "paused", "closed"].includes(raffle.status),
    [raffle]
  );

  if (isIdle) {
    return <IdleConfig onStart={actions.start} loading={state.isLoading} />;
  }

  if (isActivePhase && raffle) {
    return (
      <ActiveConfig
        raffle={raffle}
        onPause={actions.pause}
        onClose={actions.close}
        onAddEntry={actions.addEntry}
      />
    );
  }

  return (
    <div className="p-4 text-xs text-muted-foreground">
      Sorteio concluído. Inicie um novo sorteio pelo botão abaixo.
      <Button
        className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
        size="sm"
        onClick={actions.reset}
      >
        Novo sorteio
      </Button>
    </div>
  );
}
