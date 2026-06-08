"use client";

import { useEffect, useMemo, useState } from "react";
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

interface LimitOption {
  value: string;
  label: string;
}

interface SmartLimitSelectProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: LimitOption[];
  tooltip?: string;
  disabled?: boolean;
}

export function SmartLimitSelect({
  label,
  value,
  onChange,
  options,
  tooltip,
  disabled = false,
}: SmartLimitSelectProps) {
  const presetValues = useMemo(
    () =>
      new Set(
        options
          .map((option) => option.value)
          .filter((optionValue) => optionValue !== "custom")
      ),
    [options]
  );

  const [isCustom, setIsCustom] = useState(
    () => value > 0 && !presetValues.has(String(value))
  );

  useEffect(() => {
    if (value === 0) {
      setIsCustom(false);
      return;
    }
    setIsCustom(!presetValues.has(String(value)));
  }, [value, presetValues]);

  const selectValue = isCustom ? "custom" : String(value);

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
      <Select
        value={selectValue}
        disabled={disabled}
        onValueChange={(next) => {
          if (next === "custom") {
            setIsCustom(true);
            if (value === 0) onChange(1);
            return;
          }
          setIsCustom(false);
          onChange(Number(next));
        }}
      >
        <SelectTrigger className="text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isCustom ? (
        <Input
          type="number"
          min={1}
          max={10000}
          value={value || ""}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="text-center text-sm tabular-nums"
          placeholder="Quantidade"
        />
      ) : null}
    </div>
  );
}
