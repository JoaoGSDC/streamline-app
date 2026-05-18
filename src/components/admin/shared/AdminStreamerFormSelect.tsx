"use client";

import { Info, UserRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminChannel } from "@/components/admin/AdminProvider";
import { cn } from "@/lib/utils";

const MINE_VALUE = "__mine__";

interface AdminStreamerFormSelectProps {
  value: string;
  onChange: (streamerId: string) => void;
  ownerChannel: AdminChannel | null;
  moderatedChannels: AdminChannel[];
  className?: string;
  /** Rótulo do campo (padrão: Streamer) */
  label?: string;
  /**
   * Sempre exibe o select. Sem canais moderados, fica desabilitado
   * com o próprio usuário selecionado.
   */
  alwaysShow?: boolean;
  disabledHint?: string;
  enabledHint?: string;
}

export function AdminStreamerFormSelect({
  value,
  onChange,
  ownerChannel,
  moderatedChannels,
  className,
  label = "Streamer",
  alwaysShow = false,
  disabledHint = "Você não modera outros canais. O cadastro será feito no seu perfil.",
  enabledHint = "Escolha em qual canal este cadastro será registrado.",
}: AdminStreamerFormSelectProps) {
  const hasModerated = moderatedChannels.length > 0;

  if (!alwaysShow && !hasModerated) return null;

  const disabled = !hasModerated;
  const ownerLabel = ownerChannel
    ? `@${ownerChannel.twitchUsername}`
    : "Meu canal";

  const selectValue = value.trim() ? value : MINE_VALUE;

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2 text-body-sm">
        <UserRound className="h-4 w-4 text-primary" />
        {label}
      </Label>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === MINE_VALUE ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="input-cinematic" disabled={disabled}>
          <SelectValue placeholder="Selecione o streamer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={MINE_VALUE}>{ownerLabel}</SelectItem>
          {moderatedChannels.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              @{c.twitchUsername}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {disabled ? (
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground/55">
          <Info className="mt-0.5 h-3 w-3 shrink-0 opacity-70" aria-hidden />
          <span>{disabledHint}</span>
        </p>
      ) : (
        <p className="text-caption text-muted-foreground">{enabledHint}</p>
      )}
    </div>
  );
}
