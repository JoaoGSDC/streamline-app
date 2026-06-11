"use client";

import { cn } from "@/lib/utils";
import type { RaffleMode } from "../types";
import { Hash, Coins, UserPlus, Crown } from "lucide-react";

const PRESETS: Array<{
  mode: RaffleMode;
  label: string;
  icon: typeof Hash;
}> = [
  { mode: "keyword", label: "Palavra-chave", icon: Hash },
  { mode: "points", label: "Pontos", icon: Coins },
  { mode: "manual", label: "Manual", icon: UserPlus },
  { mode: "sub_only", label: "Sub only", icon: Crown },
];

export function PresetSelector({
  value,
  onChange,
  disabled,
}: {
  value: RaffleMode;
  onChange: (mode: RaffleMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mode)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-colors",
            value === mode
              ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
              : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border/60"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
