"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RaffleCreateInput } from "@services/entities/raffles.services";

interface AdvancedOptionsProps {
  config: RaffleCreateInput;
  onChange: (patch: Partial<RaffleCreateInput>) => void;
  disabled?: boolean;
}

export function AdvancedOptions({ config, onChange, disabled }: AdvancedOptionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/40">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        Opções avançadas
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/30 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Excluir moderadores</Label>
            <Switch
              checked={config.excludeMods}
              disabled={disabled}
              onCheckedChange={(v) => onChange({ excludeMods: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Excluir VIPs</Label>
            <Switch
              checked={config.excludeVips}
              disabled={disabled}
              onCheckedChange={(v) => onChange({ excludeVips: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Confirmação do vencedor</Label>
            <Switch
              checked={config.requireWinnerConfirmation}
              disabled={disabled}
              onCheckedChange={(v) => onChange({ requireWinnerConfirmation: v })}
            />
          </div>
          {config.requireWinnerConfirmation && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Palavra</Label>
                <Input
                  className="h-8 text-xs"
                  value={config.confirmationKeyword}
                  disabled={disabled}
                  onChange={(e) => onChange({ confirmationKeyword: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Timeout (s)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={config.confirmationTimeoutSeconds}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({ confirmationTimeoutSeconds: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
          <div>
            <Label className="text-[10px] text-muted-foreground">Título (opcional)</Label>
            <Input
              className="h-8 text-xs"
              value={config.title ?? ""}
              disabled={disabled}
              onChange={(e) => onChange({ title: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Descrição do prêmio</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs"
              rows={2}
              value={config.prizeDescription ?? ""}
              disabled={disabled}
              onChange={(e) => onChange({ prizeDescription: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
