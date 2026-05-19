"use client";

import { useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { normalizeColorForPicker } from "@/lib/color-utils";

const PRESET_COLORS = [
  "#9146ff",
  "#ff0000",
  "#53fc18",
  "#e4405f",
  "#5865f2",
  "#00f2ea",
  "#d4af37",
  "#2563ff",
  "#66c0f4",
  "#1db954",
  "#f0f6fc",
  "#050816",
];

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hint?: string;
}

export function ColorPickerField({
  label,
  value,
  onChange,
  className,
  hint,
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const pickerHex = normalizeColorForPicker(value);
  const swatchColor = value.trim() ? value : pickerHex;

  const applyHex = useCallback(
    (hex: string) => {
      onChange(hex);
    },
    [onChange]
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="color-picker-swatch h-10 w-12 shrink-0 cursor-pointer rounded-md border border-outline-variant/40 shadow-inner transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ background: swatchColor }}
              aria-label={`${label} — abrir seletor de cor`}
            />
          </PopoverTrigger>
          <PopoverContent
            className="color-picker-popover w-auto border-outline-variant/40 p-3"
            align="start"
            sideOffset={8}
          >
            <HexColorPicker
              color={pickerHex}
              onChange={applyHex}
              className="color-picker-wheel"
            />
            <p className="mt-2 text-caption text-muted-foreground">Presets</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={cn(
                    "h-7 w-7 rounded-md border border-white/10 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    pickerHex.toLowerCase() === hex.toLowerCase() &&
                      "ring-2 ring-primary"
                  )}
                  style={{ background: hex }}
                  onClick={() => applyHex(hex)}
                  aria-label={`Cor ${hex}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          className="input-cinematic flex-1 font-mono text-caption"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={pickerHex}
        />
      </div>
      {hint ? (
        <p className="text-caption text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
