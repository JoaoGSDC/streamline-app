"use client";

import { useState } from "react";
import { FlaskConical, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SAFE_REGEX_LENGTH, buildWordEvasionRegex } from "@/lib/regex-utils";
import { RegexTestDialog } from "./RegexTestDialog";

interface RegexPatternInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showEvasionHelper?: boolean;
  evasionSourceWord?: string;
  className?: string;
}

export function RegexPatternInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Ex.: b[o0]+l[a@]+",
  showEvasionHelper = false,
  evasionSourceWord,
  className,
}: RegexPatternInputProps) {
  const [testOpen, setTestOpen] = useState(false);

  const handleGenerateEvasion = () => {
    const source = (evasionSourceWord ?? value).trim();
    const generated = buildWordEvasionRegex(source);
    if (generated) onChange(generated);
  };

  return (
    <>
      <div className={className}>
        <div className="flex gap-2">
          <Input
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 font-mono text-xs"
            maxLength={MAX_SAFE_REGEX_LENGTH}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={disabled || !value.trim()}
            onClick={() => setTestOpen(true)}
            aria-label="Testar regex"
          >
            <FlaskConical className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showEvasionHelper ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1.5 h-7 px-2 text-xs text-muted-foreground"
            disabled={
              disabled ||
              !(evasionSourceWord ?? value).trim() ||
              !buildWordEvasionRegex((evasionSourceWord ?? value).trim())
            }
            onClick={handleGenerateEvasion}
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            Gerar regex anti-evasão
          </Button>
        ) : null}
      </div>

      <RegexTestDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        pattern={value}
        inputPlaceholder="Digite uma mensagem de chat para testar…"
        matchLabel="✓ Mensagem seria bloqueada"
        noMatchLabel="✗ Mensagem passaria"
      />
    </>
  );
}
