"use client";

import { Search, Loader2, Radio } from "lucide-react";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import type { ChannelSearchProps } from "@features/search/types/search.types";
import { useChannelSearch } from "./channel-search.hook";

export function ChannelSearch({
  className,
  placeholder = "Buscar canal na Twitch...",
}: ChannelSearchProps) {
  const {
    query,
    results,
    isSearching,
    containerRef,
    listboxId,
    showDropdown,
    showEmpty,
    activeIndex,
    clearSearch,
    handleQueryChange,
    handleInputFocus,
    handleKeyDown,
    handleOptionHover,
    handleChannelSelect,
  } = useChannelSearch({ className, placeholder });

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      role="combobox"
      aria-expanded={showDropdown}
      aria-controls={listboxId}
      aria-haspopup="listbox"
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="h-10 border-outline-variant/40 bg-surface-container-low/80 pl-10 pr-10 text-body-sm"
          autoComplete="off"
          aria-label="Buscar canal na Twitch"
          aria-autocomplete="list"
        />
        {query && !isSearching && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        )}
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <ul
          id={listboxId}
          className="glass-panel absolute z-[60] mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-outline-variant/40 py-1 shadow-none"
          role="listbox"
        >
          {results.map((channel, index) => (
            <li key={channel.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => handleOptionHover(index)}
                onClick={() => handleChannelSelect(channel.login)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  index === activeIndex
                    ? "bg-primary-container/25 text-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                {channel.thumbnailUrl ? (
                  <img
                    src={channel.thumbnailUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-body-sm">
                    {channel.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{channel.login}
                    {channel.gameName ? ` · ${channel.gameName}` : ""}
                  </p>
                </div>
                {channel.isLive && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                    <Radio className="h-3 w-3" aria-hidden />
                    Live
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div
          className="glass-panel absolute z-[60] mt-2 w-full rounded-lg border border-outline-variant/40 p-4 shadow-none"
          role="status"
        >
          <p className="text-center text-body-sm text-muted-foreground">
            Nenhum canal encontrado
          </p>
        </div>
      )}
    </div>
  );
}
