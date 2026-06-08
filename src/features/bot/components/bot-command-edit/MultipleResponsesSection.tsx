"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleSection } from "./CollapsibleSection";
import type { CommandFormBinding } from "./command-form.types";

export function MultipleResponsesSection({
  command,
  onChange,
  disabled = false,
}: CommandFormBinding) {
  if (command.responseType !== "random") return null;

  const updateAlternative = (index: number, value: string) => {
    const next = [...command.responseAlternatives];
    next[index] = value.slice(0, 500);
    onChange({ responseAlternatives: next });
  };

  const removeAlternative = (index: number) => {
    onChange({
      responseAlternatives: command.responseAlternatives.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    });
  };

  const addAlternative = () => {
    if (command.responseAlternatives.length >= 19) return;
    onChange({
      responseAlternatives: [...command.responseAlternatives, ""],
    });
  };

  return (
    <CollapsibleSection
      title="Respostas alternativas"
      subtitle="O bot escolherá uma aleatoriamente a cada uso"
      defaultOpen
    >
      <div className="space-y-2">
        {command.responseAlternatives.map((alternative, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={alternative}
              disabled={disabled}
              onChange={(event) => updateAlternative(index, event.target.value)}
              placeholder={`Resposta ${index + 2}...`}
              className="font-mono text-sm"
              maxLength={500}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              disabled={disabled}
              onClick={() => removeAlternative(index)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {command.responseAlternatives.length < 19 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={disabled}
            onClick={addAlternative}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar resposta
          </Button>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}
