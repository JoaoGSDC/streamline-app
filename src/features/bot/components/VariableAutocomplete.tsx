"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BotVariableItem } from "@services/entities/bot-variables.services";
import { AUTOCOMPLETE_CATEGORY_LABELS } from "@features/bot/utils/bot-variables.utils";
import { cn } from "@/lib/utils";

interface VariableAutocompleteProps {
  open: boolean;
  variables: BotVariableItem[];
  filter: string;
  selectedIndex: number;
  onSelect: (variable: BotVariableItem) => void;
  onHover: (index: number) => void;
}

export function VariableAutocomplete({
  open,
  variables,
  filter,
  selectedIndex,
  onSelect,
  onHover,
}: VariableAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return variables.slice(0, 40);
    return variables
      .filter(
        (item) =>
          item.key.toLowerCase().includes(query) ||
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
      .slice(0, 40);
  }, [filter, variables]);

  const grouped = useMemo(() => {
    const map = new Map<string, BotVariableItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  const flatItems = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex, flatItems]);

  if (!open || flatItems.length === 0) return null;

  let runningIndex = 0;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-full overflow-y-auto rounded-md border border-border/60 bg-popover shadow-lg"
    >
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category}>
          <p className="sticky top-0 bg-muted/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {AUTOCOMPLETE_CATEGORY_LABELS[category] ?? category}
          </p>
          {items.map((item) => {
            const index = runningIndex;
            runningIndex += 1;
            const isActive = index === selectedIndex;
            return (
              <button
                key={`${category}-${item.key}`}
                type="button"
                data-active={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left transition-colors",
                  isActive ? "bg-accent" : "hover:bg-accent/60"
                )}
                onMouseEnter={() => onHover(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(item);
                }}
              >
                <code className="text-xs font-medium text-primary">{item.key}</code>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function buildVariableInsertSpec(variableKey: string) {
  const colonIndex = variableKey.indexOf(":");
  if (colonIndex === -1) {
    return { text: variableKey };
  }
  return {
    text: variableKey,
    selectOffsetStart: colonIndex + 1,
    selectOffsetEnd: variableKey.length - 1,
  };
}
