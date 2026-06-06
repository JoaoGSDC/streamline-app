"use client";

import { cn } from "@/lib/utils";
import {
  CATEGORY_FILTER_LABELS,
  type BotCommandCategoryFilter,
} from "@features/bot/types/bot-command.types";

const FILTER_ORDER: BotCommandCategoryFilter[] = [
  "all",
  "general",
  "raffles",
  "moderator",
  "streamer",
  "custom",
];

interface BotCommandCategoryFiltersProps {
  value: BotCommandCategoryFilter;
  onChange: (value: BotCommandCategoryFilter) => void;
  counts: Record<BotCommandCategoryFilter, number>;
}

export function BotCommandCategoryFilters({
  value,
  onChange,
  counts,
}: BotCommandCategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoria">
      {FILTER_ORDER.map((filter) => {
        const active = value === filter;
        const count = counts[filter];
        return (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-caption font-medium transition-colors",
              active
                ? "bg-[hsl(var(--sidebar-active-bg))] text-white"
                : "border border-outline-variant/30 text-muted-foreground hover:border-outline-variant/50 hover:text-foreground"
            )}
          >
            {CATEGORY_FILTER_LABELS[filter]}
            {filter !== "all" && (
              <span className={cn("ml-1", active ? "text-white/80" : "text-muted-foreground/80")}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
