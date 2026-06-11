"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { services } from "@services/index";
import { CollapsibleSection } from "./CollapsibleSection";
import type { CommandFormBinding } from "./command-form.types";
import {
  COMMAND_COUNTER_RUNTIME_VARIABLES,
  resolveEditorCounterEffect,
  type CommandCounterEffect,
} from "@server/bot/command-counter-effect";
import type { CounterDto } from "@server/counters/counters.types";

function patchEffect(
  current: CommandCounterEffect,
  patch: Partial<CommandCounterEffect>
): CommandCounterEffect {
  return { ...current, ...patch };
}

export function CounterEffectSection({
  command,
  onChange,
  disabled = false,
}: CommandFormBinding) {
  const effect = resolveEditorCounterEffect(command.counterEffect);
  const [counters, setCounters] = useState<CounterDto[]>([]);
  const [loadingCounters, setLoadingCounters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingCounters(true);
    void services.counters
      .listCounters({ status: "active" })
      .then((result) => {
        if (!cancelled) setCounters(result.items);
      })
      .catch(() => {
        if (!cancelled) setCounters([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCounters(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const manualCounters = counters.filter((c) => !c.readonly);

  const updateEffect = (next: CommandCounterEffect) => {
    onChange({ counterEffect: next });
  };

  return (
    <CollapsibleSection title="Contador" defaultOpen={effect.enabled}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Alterar contador ao usar</p>
            <p className="text-xs text-muted-foreground">
              Ex.: comando <code className="text-purple-300">!mortes</code> com
              +1 em <code className="text-purple-300">mortes</code>. Use{" "}
              <code className="text-purple-300">{`{count:mortes}`}</code> na
              resposta.
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
                <Label className="text-xs text-muted-foreground">Contador</Label>
                <Select
                  value={effect.slug || undefined}
                  disabled={disabled || loadingCounters}
                  onValueChange={(slug) =>
                    updateEffect(patchEffect(effect, { slug }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contador" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualCounters.map((counter) => (
                      <SelectItem key={counter.id} value={counter.slug}>
                        {counter.name} ({counter.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingCounters && manualCounters.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Crie um contador em Admin → Contadores → Lista.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Operação</Label>
                <Select
                  value={effect.operation}
                  disabled={disabled}
                  onValueChange={(operation) =>
                    updateEffect(
                      patchEffect(effect, {
                        operation: operation as CommandCounterEffect["operation"],
                      })
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increment">Somar (+)</SelectItem>
                    <SelectItem value="decrement">Subtrair (−)</SelectItem>
                    <SelectItem value="set">Definir valor</SelectItem>
                    <SelectItem value="reset">Zerar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {effect.operation === "increment" ||
            effect.operation === "decrement" ||
            effect.operation === "set" ? (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {effect.operation === "set" ? "Novo valor" : "Quantidade"}
                </Label>
                <Input
                  type="number"
                  min={effect.operation === "set" ? 0 : 1}
                  disabled={disabled}
                  value={effect.amount ?? (effect.operation === "set" ? 0 : 1)}
                  onChange={(event) =>
                    updateEffect(
                      patchEffect(effect, {
                        amount: Number(event.target.value) || 0,
                      })
                    )
                  }
                />
              </div>
            ) : null}

            <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground/80">
                Variáveis na resposta
              </p>
              <ul className="space-y-0.5">
                {COMMAND_COUNTER_RUNTIME_VARIABLES.map((item) => (
                  <li key={item.name}>
                    <code className="text-purple-300">{`{${item.name}}`}</code> —{" "}
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
