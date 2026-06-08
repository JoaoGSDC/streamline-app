"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { RegexTestDialog } from "./RegexTestDialog";
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

interface AdvancedSectionProps extends CommandFormBinding {
  isBuiltin: boolean;
}

export function AdvancedSection({
  command,
  onChange,
  disabled = false,
  isBuiltin,
}: AdvancedSectionProps) {
  const [regexTestOpen, setRegexTestOpen] = useState(false);
  const sectionDisabled = disabled || isBuiltin;

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
              disabled={sectionDisabled}
              onCheckedChange={(requiresConfirmation) =>
                onChange({ requiresConfirmation })
              }
            />
            {!isBuiltin ? (
              <ToggleRow
                label="Resposta como ação (/me)"
                description="Bot envia a mensagem como /me (texto em itálico/colorido)."
                checked={command.isActionResponse}
                disabled={disabled}
                onCheckedChange={(isActionResponse) =>
                  onChange({ isActionResponse })
                }
              />
            ) : null}
            {!isBuiltin ? (
              <ToggleRow
                label="Case sensitive"
                description="!Hugs e !hugs serão tratados como comandos diferentes."
                checked={command.isCaseSensitive}
                disabled={disabled}
                onCheckedChange={(isCaseSensitive) =>
                  onChange({ isCaseSensitive })
                }
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Validação de argumento
            </Label>
            <Select
              value={command.argValidationType}
              disabled={sectionDisabled}
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
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Input
                      value={command.argRegexPattern || ""}
                      disabled={sectionDisabled}
                      onChange={(event) =>
                        onChange({ argRegexPattern: event.target.value })
                      }
                      placeholder="^[a-zA-Z0-9_]+$"
                      className="font-mono text-xs"
                      maxLength={300}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={!command.argRegexPattern?.trim()}
                      onClick={() => setRegexTestOpen(true)}
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={command.argValidationError || ""}
                  disabled={sectionDisabled}
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

          {isBuiltin ? (
            <p className="text-xs text-muted-foreground/70">
              Opções avançadas de comandos padrão são definidas pelo sistema.
            </p>
          ) : null}
        </div>
      </CollapsibleSection>

      <RegexTestDialog
        open={regexTestOpen}
        onOpenChange={setRegexTestOpen}
        pattern={command.argRegexPattern}
      />
    </>
  );
}
