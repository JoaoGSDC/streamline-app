"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  cooldownDisplayToSeconds,
  inferCooldownUnit,
  secondsToCooldownDisplay,
  type CooldownUnit,
} from "./command-form.utils";

interface CooldownInputProps {
  label: string;
  value: number;
  onChange: (seconds: number) => void;
  tooltip?: string;
  disabled?: boolean;
}

export function CooldownInput({
  label,
  value,
  onChange,
  tooltip,
  disabled = false,
}: CooldownInputProps) {
  const [unit, setUnit] = useState<CooldownUnit>(() => inferCooldownUnit(value));
  const [displayValue, setDisplayValue] = useState(() =>
    secondsToCooldownDisplay(value, inferCooldownUnit(value))
  );

  useEffect(() => {
    const nextUnit = inferCooldownUnit(value);
    setUnit(nextUnit);
    setDisplayValue(secondsToCooldownDisplay(value, nextUnit));
  }, [value]);

  const applyDisplay = (raw: number, nextUnit: CooldownUnit) => {
    const safe = Math.max(0, raw);
    setDisplayValue(safe);
    onChange(cooldownDisplayToSeconds(safe, nextUnit));
  };

  const maxByUnit: Record<CooldownUnit, number> = {
    seconds: 86400,
    minutes: 1440,
    hours: 24,
  };

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {tooltip ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/70">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </Label>
      <div className="flex gap-1.5">
        <Input
          type="number"
          min={0}
          max={maxByUnit[unit]}
          value={displayValue}
          disabled={disabled}
          onChange={(event) => {
            const raw = parseInt(event.target.value, 10) || 0;
            applyDisplay(raw, unit);
          }}
          className="w-16 text-center tabular-nums"
        />
        <Select
          value={unit}
          disabled={disabled}
          onValueChange={(nextUnit: CooldownUnit) => {
            setUnit(nextUnit);
            const converted = secondsToCooldownDisplay(value, nextUnit);
            applyDisplay(converted, nextUnit);
          }}
        >
          <SelectTrigger className="flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seconds">segundos</SelectItem>
            <SelectItem value="minutes">minutos</SelectItem>
            <SelectItem value="hours">horas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
