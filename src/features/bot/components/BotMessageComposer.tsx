"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  AUTOCOMPLETE_CATEGORY_LABELS,
} from "@features/bot/utils/bot-variables.utils";
import {
  buildVariableInsertSpec,
  VariableAutocomplete,
} from "@features/bot/components/VariableAutocomplete";

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
  variant?: "default" | "compact";
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
  variant = "default",
}: BotMessageComposerProps) {
  const isCompact = variant === "compact";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteFilter, setAutocompleteFilter] = useState("");
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [bracePosition, setBracePosition] = useState<number | null>(null);

  const filteredAutocompleteItems = useMemo(() => {
    const query = autocompleteFilter.trim().toLowerCase();
    if (!query) return variables.slice(0, 40);
    return variables
      .filter(
        (item) =>
          item.key.toLowerCase().includes(query) ||
          item.label.toLowerCase().includes(query)
      )
      .slice(0, 40);
  }, [autocompleteFilter, variables]);

  const insertAtCursor = useCallback(
    (
      snippet: string,
      selection?: { startOffset: number; endOffset: number }
    ) => {
      const element = textareaRef.current;
      if (!element) {
        onChange(`${value}${snippet}`.slice(0, maxLength));
        return;
      }

      const start = element.selectionStart ?? value.length;
      const end = element.selectionEnd ?? value.length;
      const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
      onChange(next.slice(0, maxLength));

      requestAnimationFrame(() => {
        element.focus();
        if (selection) {
          const selectStart = start + selection.startOffset;
          const selectEnd = start + selection.endOffset;
          element.setSelectionRange(selectStart, selectEnd);
          return;
        }
        const position = Math.min(start + snippet.length, maxLength);
        element.setSelectionRange(position, position);
      });
    },
    [maxLength, onChange, value]
  );

  const closeAutocomplete = useCallback(() => {
    setAutocompleteOpen(false);
    setAutocompleteFilter("");
    setAutocompleteIndex(0);
    setBracePosition(null);
  }, []);

  const insertVariable = useCallback(
    (variable: BotVariableItem) => {
      const element = textareaRef.current;
      const cursor = element?.selectionStart ?? value.length;
      const anchor = bracePosition ?? Math.max(0, cursor - 1);

      if (bracePosition != null && element) {
        const before = value.slice(0, anchor);
        const after = value.slice(cursor);
        const spec = buildVariableInsertSpec(variable.key);
        const next = `${before}${spec.text}${after}`.slice(0, maxLength);
        onChange(next);
        requestAnimationFrame(() => {
          element.focus();
          if (spec.selectOffsetStart != null && spec.selectOffsetEnd != null) {
            element.setSelectionRange(
              anchor + spec.selectOffsetStart,
              anchor + spec.selectOffsetEnd
            );
          } else {
            const position = anchor + spec.text.length;
            element.setSelectionRange(position, position);
          }
        });
      } else {
        const spec = buildVariableInsertSpec(variable.key);
        insertAtCursor(spec.text, {
          startOffset: spec.selectOffsetStart ?? spec.text.length,
          endOffset: spec.selectOffsetEnd ?? spec.text.length,
        });
      }

      closeAutocomplete();
      setVariablesOpen(false);
    },
    [bracePosition, closeAutocomplete, insertAtCursor, maxLength, onChange, value]
  );

  const handleTextareaChange = (nextValue: string) => {
    const element = textareaRef.current;
    onChange(nextValue.slice(0, maxLength));

    if (!element || !autocompleteOpen || bracePosition == null) return;
    const cursor = element.selectionStart ?? nextValue.length;
    if (cursor <= bracePosition) {
      closeAutocomplete();
      return;
    }
    setAutocompleteFilter(nextValue.slice(bracePosition + 1, cursor));
    setAutocompleteIndex(0);
  };

  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "{" && !autocompleteOpen) {
      const cursor = event.currentTarget.selectionStart ?? value.length;
      setBracePosition(cursor);
      setAutocompleteOpen(true);
      setAutocompleteFilter("");
      setAutocompleteIndex(0);
      return;
    }

    if (!autocompleteOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeAutocomplete();
      return;
    }

    if (filteredAutocompleteItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAutocompleteIndex(
        (prev) => (prev + 1) % filteredAutocompleteItems.length
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setAutocompleteIndex((prev) =>
        prev === 0 ? filteredAutocompleteItems.length - 1 : prev - 1
      );
      return;
    }

    if (event.key === "Enter" && autocompleteOpen) {
      event.preventDefault();
      const selected = filteredAutocompleteItems[autocompleteIndex];
      if (selected) insertVariable(selected);
    }
  };

  const variableGroups = groupVariablesByCategory(variables);

  return (
    <div className="space-y-2 overflow-hidden">
      <div className="relative">
        <VariableAutocomplete
          open={autocompleteOpen}
          variables={variables}
          filter={autocompleteFilter}
          selectedIndex={autocompleteIndex}
          onSelect={insertVariable}
          onHover={setAutocompleteIndex}
        />
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => handleTextareaChange(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          onBlur={() => {
            window.setTimeout(() => closeAutocomplete(), 120);
          }}
          rows={isCompact ? 3 : 4}
          placeholder={placeholder}
          disabled={disabled}
          className={
            isCompact
              ? "min-h-[80px] max-w-full resize-none text-sm leading-relaxed"
              : "max-w-full break-words font-mono text-body-sm"
          }
        />
      </div>

      <div
        className={
          isCompact
            ? "flex items-center justify-between gap-2"
            : "flex flex-wrap items-center gap-2"
        }
      >
        <div className="flex gap-2">
          <Popover open={variablesOpen} onOpenChange={setVariablesOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={isCompact ? "ghost" : "outline"}
                size="sm"
                disabled={disabled}
                className={isCompact ? "h-7 px-2.5 text-xs" : undefined}
              >
                <Braces
                  className={isCompact ? "mr-1.5 h-3 w-3" : "mr-2 h-4 w-4"}
                />
                Variáveis
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <ScrollArea className="h-72">
                <div className="space-y-3 p-3">
                  {[...variableGroups.entries()].map(([category, items]) => (
                    <div key={category}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {AUTOCOMPLETE_CATEGORY_LABELS[category] ?? category}
                      </p>
                      <ul className="space-y-1">
                        {items.map((variable) => (
                          <li key={`${category}-${variable.key}`}>
                            <button
                              type="button"
                              className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                              onClick={() => insertVariable(variable)}
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
              <Button
                type="button"
                variant={isCompact ? "ghost" : "outline"}
                size="sm"
                disabled={disabled}
                className={isCompact ? "h-7 px-2.5 text-xs" : undefined}
              >
                <Smile
                  className={isCompact ? "mr-1.5 h-3 w-3" : "mr-2 h-4 w-4"}
                />
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

          {onSave ? (
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
          ) : null}
        </div>

        <span
          className={
            isCompact
              ? "text-xs tabular-nums text-muted-foreground"
              : "ml-auto text-body-sm text-muted-foreground"
          }
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
