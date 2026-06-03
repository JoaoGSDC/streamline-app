"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Braces, Save, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import type { TwitchChannelEmote } from "@services/entities/bot-emotes.services";

interface BotMessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  variables: BotVariableItem[];
  emotes: TwitchChannelEmote[];
  emotesLoading?: boolean;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  onSave?: () => void;
  saving?: boolean;
}

function groupVariablesByCategory(variables: BotVariableItem[]) {
  const groups = new Map<string, BotVariableItem[]>();
  for (const variable of variables) {
    const key = variable.category;
    const list = groups.get(key) ?? [];
    list.push(variable);
    groups.set(key, list);
  }
  return groups;
}

const CATEGORY_LABELS: Record<string, string> = {
  global: "Globais",
  args: "Argumentos",
  counter: "Contadores",
  timer: "Timers",
  meta: "Runtime",
};

export function BotMessageComposer({
  value,
  onChange,
  variables,
  emotes,
  emotesLoading = false,
  maxLength = 500,
  placeholder = "Mensagem de resposta…",
  disabled = false,
  onSave,
  saving = false,
}: BotMessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [emotesOpen, setEmotesOpen] = useState(false);

  const insertAtCursor = useCallback(
    (snippet: string) => {
      const element = textareaRef.current;
      if (!element) {
        onChange(`${value}${snippet}`);
        return;
      }

      const start = element.selectionStart ?? value.length;
      const end = element.selectionEnd ?? value.length;
      const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
      onChange(next.slice(0, maxLength));

      requestAnimationFrame(() => {
        element.focus();
        const position = Math.min(start + snippet.length, maxLength);
        element.setSelectionRange(position, position);
      });
    },
    [maxLength, onChange, value]
  );

  const variableGroups = groupVariablesByCategory(variables);

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        rows={4}
        placeholder={placeholder}
        disabled={disabled}
        className="font-mono text-body-sm"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Popover open={variablesOpen} onOpenChange={setVariablesOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              <Braces className="mr-2 h-4 w-4" />
              Variáveis
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <ScrollArea className="h-72">
              <div className="space-y-3 p-3">
                {[...variableGroups.entries()].map(([category, items]) => (
                  <div key={category}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {CATEGORY_LABELS[category] ?? category}
                    </p>
                    <ul className="space-y-1">
                      {items.map((variable) => (
                        <li key={`${category}-${variable.key}`}>
                          <button
                            type="button"
                            className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                            onClick={() => {
                              insertAtCursor(variable.key);
                              setVariablesOpen(false);
                            }}
                          >
                            <code className="text-body-sm font-semibold text-primary">
                              {variable.key}
                            </code>
                            <p className="text-xs text-muted-foreground">
                              {variable.label} — {variable.description}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Popover open={emotesOpen} onOpenChange={setEmotesOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              <Smile className="mr-2 h-4 w-4" />
              Emotes do canal
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <ScrollArea className="h-80">
              {emotesLoading ? (
                <p className="p-4 text-body-sm text-muted-foreground">
                  Carregando emotes…
                </p>
              ) : emotes.length === 0 ? (
                <p className="p-4 text-body-sm text-muted-foreground">
                  Nenhum emote de canal encontrado. Verifique se a conta Twitch
                  está vinculada e possui emotes publicados.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 p-3">
                  {emotes.map((emote) => (
                    <button
                      key={emote.id}
                      type="button"
                      title={emote.name}
                      className="flex flex-col items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-accent"
                      onClick={() => {
                        insertAtCursor(
                          value.length > 0 && !value.endsWith(" ")
                            ? ` ${emote.code}`
                            : emote.code
                        );
                        setEmotesOpen(false);
                      }}
                    >
                      <Image
                        src={emote.imageUrl2x || emote.imageUrl1x}
                        alt={emote.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 object-contain"
                      />
                      <span className="max-w-full truncate text-[10px] text-muted-foreground">
                        {emote.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {onSave && (
          <Button
            type="button"
            size="sm"
            variant="default"
            className="font-semibold shadow-sm"
            onClick={onSave}
            disabled={disabled || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        )}

        <span className="ml-auto text-body-sm text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
