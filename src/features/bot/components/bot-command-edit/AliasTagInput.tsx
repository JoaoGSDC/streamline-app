"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { validateAlias } from "./command-form.utils";

interface AliasTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function AliasTagInput({
  value,
  onChange,
  maxItems = 5,
  placeholder = "!alias1 e pressione Enter...",
  disabled = false,
}: AliasTagInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addAlias = () => {
    const trimmed = draft.trim().replace(/\s/g, "");
    if (!trimmed) return;

    const validationError = validateAlias(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (value.includes(trimmed)) {
      setError("Alias já adicionado");
      return;
    }

    if (value.length >= maxItems) {
      setError(`Máximo de ${maxItems} aliases`);
      return;
    }

    onChange([...value, trimmed]);
    setDraft("");
    setError(null);
  };

  const removeAlias = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((alias, index) => (
            <span
              key={`${alias}-${index}`}
              className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 font-mono text-xs"
            >
              {alias}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                disabled={disabled}
                onClick={() => removeAlias(index)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {value.length < maxItems ? (
        <Input
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          className="font-mono text-sm"
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addAlias();
            }
          }}
          onBlur={() => {
            if (draft.trim()) addAlias();
          }}
        />
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
