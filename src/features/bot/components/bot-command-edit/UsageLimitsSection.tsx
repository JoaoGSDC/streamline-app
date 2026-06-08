"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleSection } from "./CollapsibleSection";
import { CooldownInput } from "./CooldownInput";
import { SmartLimitSelect } from "./SmartLimitSelect";
import type { CommandFormBinding } from "./command-form.types";
import {
  limitsSummary,
  seasonalExample,
  seasonalPeriodLabel,
} from "./command-form.utils";

const LIMIT_OPTIONS = [
  { value: "0", label: "Ilimitado" },
  { value: "1", label: "1 vez" },
  { value: "2", label: "2 vezes" },
  { value: "3", label: "3 vezes" },
  { value: "5", label: "5 vezes" },
  { value: "10", label: "10 vezes" },
  { value: "custom", label: "Personalizado..." },
];

const SEASONAL_TYPES = [
  { value: "none", label: "Sem limite sazonal" },
  { value: "daily", label: "Por dia" },
  { value: "weekly", label: "Por semana" },
  { value: "monthly", label: "Por mês" },
  { value: "custom_interval", label: "Intervalo personalizado..." },
] as const;

export function UsageLimitsSection({
  command,
  onChange,
  disabled = false,
}: CommandFormBinding) {
  const sectionDisabled = disabled;

  return (
    <CollapsibleSection
      title="Limites de uso"
      subtitle={limitsSummary(command)}
    >
      <div className="mb-3 grid grid-cols-2 gap-3">
        <CooldownInput
          label="Cooldown global"
          value={command.cooldownSeconds}
          disabled={sectionDisabled}
          onChange={(cooldownSeconds) => onChange({ cooldownSeconds })}
          tooltip="Tempo mínimo entre usos de qualquer viewer"
        />
        <CooldownInput
          label="Cooldown por usuário"
          value={command.userCooldown}
          disabled={sectionDisabled}
          onChange={(userCooldown) => onChange({ userCooldown })}
          tooltip="Tempo mínimo entre usos do mesmo viewer"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <SmartLimitSelect
          label="Máx. usos por stream"
          value={command.maxUsesPerStream}
          disabled={sectionDisabled}
          onChange={(maxUsesPerStream) => onChange({ maxUsesPerStream })}
          options={LIMIT_OPTIONS}
          tooltip="Total de usos do comando em uma stream"
        />
        <SmartLimitSelect
          label="Máx. usos por viewer/stream"
          value={command.maxUsesPerUserPerStream}
          disabled={sectionDisabled}
          onChange={(maxUsesPerUserPerStream) =>
            onChange({ maxUsesPerUserPerStream })
          }
          options={LIMIT_OPTIONS}
          tooltip="Quantas vezes cada viewer pode usar por stream"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Limite sazonal
        </Label>
        <Select
          value={command.seasonalLimitType}
          disabled={sectionDisabled}
          onValueChange={(value) =>
            onChange({
              seasonalLimitType: value as typeof command.seasonalLimitType,
            })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEASONAL_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {command.seasonalLimitType !== "none" ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">Máximo de</span>
            <Input
              type="number"
              min={1}
              max={500}
              disabled={sectionDisabled}
              value={command.seasonalLimitAmount || ""}
              onChange={(event) =>
                onChange({
                  seasonalLimitAmount: Number(event.target.value) || 0,
                })
              }
              className="w-20 text-center"
              placeholder="X"
            />
            <span className="text-sm text-muted-foreground">
              {seasonalPeriodLabel(command.seasonalLimitType)}
            </span>
            {command.seasonalLimitType === "custom_interval" ? (
              <>
                <span className="text-sm text-muted-foreground">a cada</span>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  disabled={sectionDisabled}
                  value={command.seasonalLimitDays || ""}
                  onChange={(event) =>
                    onChange({
                      seasonalLimitDays: Number(event.target.value) || 0,
                    })
                  }
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </>
            ) : null}
          </div>
        ) : null}

        {command.seasonalLimitType !== "none" &&
        command.seasonalLimitAmount > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground/70">
            {seasonalExample(command)}
          </p>
        ) : null}

      </div>
    </CollapsibleSection>
  );
}
