"use client";

import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleSection } from "./CollapsibleSection";
import type { CommandFormBinding } from "./command-form.types";
import {
  COMMAND_POINTS_RUNTIME_VARIABLES,
  resolveEditorPointsEffect,
  type CommandPointsEffect,
} from "@server/bot/command-points-effect";

interface PointsEffectSectionProps extends CommandFormBinding {
  economyRewardKey?: "daily" | "early" | null;
  economyRewardPoints?: number | null;
}

function patchEffect(
  current: CommandPointsEffect,
  patch: Partial<CommandPointsEffect>
): CommandPointsEffect {
  return { ...current, ...patch };
}

export function PointsEffectSection({
  command,
  onChange,
  disabled = false,
  economyRewardKey,
  economyRewardPoints,
}: PointsEffectSectionProps) {
  const effect = resolveEditorPointsEffect({
    pointsEffect: command.pointsEffect,
    builtinKey: command.builtinKey,
    economyRewardKey,
    economyRewardPoints,
  });

  const updateEffect = (next: CommandPointsEffect) => {
    onChange({ pointsEffect: next });
  };

  return (
    <CollapsibleSection title="Pontos" defaultOpen={effect.enabled}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Conceder pontos ao usar</p>
            <p className="text-xs text-muted-foreground">
              Configure quanto o viewer ganha ou perde. Use{" "}
              <code className="text-purple-300">{`{pointsAdded}`}</code> na resposta.
            </p>
          </div>
          <Switch
            checked={effect.enabled}
            disabled={disabled}
            onCheckedChange={(checked) =>
              updateEffect(patchEffect(effect, { enabled: checked }))
            }
          />
        </div>

        {effect.enabled ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Modo</Label>
                <Select
                  value={effect.mode}
                  disabled={disabled}
                  onValueChange={(mode) =>
                    updateEffect(
                      patchEffect(effect, {
                        mode: mode as CommandPointsEffect["mode"],
                        rules:
                          mode === "conditional"
                            ? effect.rules?.length
                              ? effect.rules
                              : [{ variable: "jokenpoResult", equals: "win", amount: 10 }]
                            : effect.rules,
                      })
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Valor fixo</SelectItem>
                    <SelectItem value="random">Aleatório (min–max)</SelectItem>
                    <SelectItem value="conditional">Condicional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Limite</Label>
                <Select
                  value={effect.limit}
                  disabled={disabled || Boolean(effect.requireLive)}
                  onValueChange={(limit) =>
                    updateEffect(
                      patchEffect(effect, {
                        limit: limit as CommandPointsEffect["limit"],
                      })
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem limite</SelectItem>
                    <SelectItem value="once_per_user_per_stream">
                      1× por viewer por live
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {effect.mode === "fixed" ? (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pontos</Label>
                <Input
                  type="number"
                  disabled={disabled}
                  value={effect.amount ?? 0}
                  onChange={(event) =>
                    updateEffect(
                      patchEffect(effect, {
                        amount: Number(event.target.value) || 0,
                      })
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Valores negativos removem pontos (ex.: penalidade no jokenpo).
                </p>
              </div>
            ) : null}

            {effect.mode === "random" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={disabled}
                    value={effect.min ?? 0}
                    onChange={(event) =>
                      updateEffect(
                        patchEffect(effect, { min: Number(event.target.value) || 0 })
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Máximo</Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={disabled}
                    value={effect.max ?? 0}
                    onChange={(event) =>
                      updateEffect(
                        patchEffect(effect, { max: Number(event.target.value) || 0 })
                      )
                    }
                  />
                </div>
              </div>
            ) : null}

            {effect.mode === "conditional" ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Regras (variável = valor → pontos)
                </Label>
                {(effect.rules ?? []).map((rule, index) => (
                  <div
                    key={`${rule.variable}-${index}`}
                    className="grid grid-cols-[1fr_1fr_100px_32px] items-center gap-2"
                  >
                    <Input
                      placeholder="variável"
                      disabled={disabled}
                      value={rule.variable}
                      onChange={(event) => {
                        const rules = [...(effect.rules ?? [])];
                        rules[index] = { ...rule, variable: event.target.value };
                        updateEffect(patchEffect(effect, { rules }));
                      }}
                    />
                    <Input
                      placeholder="valor"
                      disabled={disabled}
                      value={rule.equals}
                      onChange={(event) => {
                        const rules = [...(effect.rules ?? [])];
                        rules[index] = { ...rule, equals: event.target.value };
                        updateEffect(patchEffect(effect, { rules }));
                      }}
                    />
                    <Input
                      type="number"
                      disabled={disabled}
                      value={rule.amount}
                      onChange={(event) => {
                        const rules = [...(effect.rules ?? [])];
                        rules[index] = {
                          ...rule,
                          amount: Number(event.target.value) || 0,
                        };
                        updateEffect(patchEffect(effect, { rules }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      disabled={disabled}
                      onClick={() => {
                        const rules = (effect.rules ?? []).filter((_, i) => i !== index);
                        updateEffect(patchEffect(effect, { rules }));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    updateEffect(
                      patchEffect(effect, {
                        rules: [
                          ...(effect.rules ?? []),
                          { variable: "jokenpoResult", equals: "win", amount: 10 },
                        ],
                      })
                    )
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Adicionar regra
                </Button>
              </div>
            ) : null}

            {effect.requireLive ? (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                Este comando exige live online e permite 1 resgate por viewer por
                transmissão ({effect.liveRewardKey ?? "recompensa"}).
              </p>
            ) : null}

            <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground/80">
                Variáveis úteis para regras condicionais
              </p>
              <ul className="space-y-0.5">
                {COMMAND_POINTS_RUNTIME_VARIABLES.filter(
                  (item) => item.name !== "pointsAdded"
                ).map((item) => (
                  <li key={item.name}>
                    <code className="text-purple-300">{item.name}</code> —{" "}
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}
