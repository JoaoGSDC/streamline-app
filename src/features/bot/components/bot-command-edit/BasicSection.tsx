"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BotMessageComposer } from "@features/bot/components/BotMessageComposer";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";
import { AliasTagInput } from "./AliasTagInput";
import type { CommandFormBinding } from "./command-form.types";
import { TRIGGER_MAX_LENGTH } from "./command-form.utils";

interface BasicSectionProps extends CommandFormBinding {
  isBuiltin: boolean;
  variables: BotVariableItem[];
  emotes: TwitchChannelEmote[];
  emotesLoading?: boolean;
}

export function BasicSection({
  command,
  onChange,
  disabled = false,
  triggerError,
  variables,
  emotes,
  emotesLoading,
}: BasicSectionProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Comando
        </Label>
        <Input
          value={command.trigger}
          disabled={disabled}
          maxLength={TRIGGER_MAX_LENGTH}
          onChange={(event) =>
            onChange({
              trigger: event.target.value.replace(/\s/g, "").slice(0, TRIGGER_MAX_LENGTH),
            })
          }
          placeholder="!meucomando"
          className="font-mono"
        />
        {triggerError ? (
          <p className="text-xs text-destructive">{triggerError}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Aliases{" "}
          <span className="font-normal normal-case">
            (triggers alternativos, máx. 5)
          </span>
        </Label>
        <AliasTagInput
          value={command.aliases}
          onChange={(aliases) => onChange({ aliases })}
          maxItems={5}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resposta
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Múltiplas respostas
            </span>
            <Switch
              checked={command.responseType === "random"}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange({ responseType: checked ? "random" : "text" })
              }
            />
          </div>
        </div>
        <BotMessageComposer
          value={command.response}
          onChange={(response) => onChange({ response })}
          variables={variables}
          emotes={emotes}
          emotesLoading={emotesLoading}
          disabled={disabled}
          placeholder="Mensagem que o bot enviará no chat..."
          maxLength={500}
          variant="compact"
        />
        {command.responseTemplate && !command.response.trim() ? (
          <p className="text-xs text-muted-foreground">
            Modelo padrão do sistema:{" "}
            <span className="font-mono">{command.responseTemplate}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
