"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleSection } from "./CollapsibleSection";
import { RegexPatternInput } from "@/components/shared/RegexPatternInput";
import type { CommandFormBinding } from "./command-form.types";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function AdvancedSection({
  command,
  onChange,
  disabled = false,
}: CommandFormBinding) {
  return (
    <>
      <CollapsibleSection
        title="Avançado"
        badge="Avançado"
        subtitle="Confirmação, validação de argumentos, comportamento especial"
      >
        <div className="space-y-4">
          <div className="space-y-2.5">
            <ToggleRow
              label="Requer confirmação"
              description='O bot pergunta "Confirma? (sim/não)" antes de executar.'
              checked={command.requiresConfirmation}
              disabled={disabled}
              onCheckedChange={(requiresConfirmation) =>
                onChange({ requiresConfirmation })
              }
            />
            <ToggleRow
              label="Resposta como ação (/me)"
              description="Bot envia a mensagem como /me (texto em itálico/colorido)."
              checked={command.isActionResponse}
              disabled={disabled}
              onCheckedChange={(isActionResponse) =>
                onChange({ isActionResponse })
              }
            />
            <ToggleRow
              label="Case sensitive"
              description="!Hugs e !hugs serão tratados como comandos diferentes."
              checked={command.isCaseSensitive}
              disabled={disabled}
              onCheckedChange={(isCaseSensitive) =>
                onChange({ isCaseSensitive })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Validação de argumento
            </Label>
            <Select
              value={command.argValidationType}
              disabled={disabled}
              onValueChange={(value) =>
                onChange({
                  argValidationType: value as typeof command.argValidationType,
                })
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Nenhuma (argumento opcional)
                </SelectItem>
                <SelectItem value="required">Argumento obrigatório</SelectItem>
                <SelectItem value="regex">Regex personalizado</SelectItem>
              </SelectContent>
            </Select>

            {command.argValidationType === "regex" ? (
              <div className="mt-2 space-y-2">
                <RegexPatternInput
                  value={command.argRegexPattern || ""}
                  onChange={(argRegexPattern) => onChange({ argRegexPattern })}
                  disabled={disabled}
                  placeholder="^[a-zA-Z0-9_]+$"
                />
                <Input
                  value={command.argValidationError || ""}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({ argValidationError: event.target.value })
                  }
                  placeholder="Uso: !comando @usuario (ex: !ban @fulano)"
                  className="text-sm"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Esta mensagem é enviada no chat quando o argumento não passa na
                  validação.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
