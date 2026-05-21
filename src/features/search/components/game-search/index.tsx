"use client";

import { Search, Loader2 } from "lucide-react";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import type { GameSearchProps } from "@features/search/types/search.types";
import { useGameSearch } from "./game-search.hook";

export function GameSearch({
  onGameSelect,
  placeholder = "Buscar jogos (use IGDB)...",
  className,
}: GameSearchProps) {
  const {
    query,
    results,
    isSearching,
    containerRef,
    inputRef,
    listboxId,
    showDropdown,
    showEmpty,
    activeIndex,
    pickGame,
    clearSearch,
    handleQueryChange,
    handleInputFocus,
    handleKeyDown,
    handleOptionHover,
    getCoverUrl,
  } = useGameSearch({ onGameSelect });

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", showDropdown && "z-50", className)}
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
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Buscar jogo no IGDB"
          aria-autocomplete="list"
        />
        <div
          className="pointer-events-none absolute right-3 top-1/2 flex h-4 w-10 -translate-y-1/2 items-center justify-end"
          aria-hidden={!query && !isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={clearSearch}
              className="pointer-events-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          ) : null}
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <ul
          id={listboxId}
          className="autocomplete-dropdown absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-lg py-1"
          role="listbox"
          onMouseDown={(event) => event.preventDefault()}
        >
          {results.map((game, index) => (
            <li
              key={game.id}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseEnter={() => handleOptionHover(index)}
                onClick={() => pickGame(game)}
                className={cn(
                  "flex w-full items-center gap-3 p-3 text-left transition-colors",
                  index === activeIndex
                    ? "bg-accent text-foreground"
                    : "hover:bg-accent/80"
                )}
              >
                <img
                  src={getCoverUrl(game)}
                  alt=""
                  className="h-20 w-16 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{game.name}</p>
                  {game.summary && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {game.summary}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div
          className="autocomplete-dropdown absolute z-50 mt-2 w-full rounded-lg border border-border bg-card p-4 shadow-lg"
          role="status"
          onMouseDown={(event) => event.preventDefault()}
        >
          <p className="text-center text-sm text-muted-foreground">
            Nenhum jogo encontrado
          </p>
        </div>
      )}
    </div>
  );
}
