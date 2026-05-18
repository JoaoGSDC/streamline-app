"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Game {
  id: number;
  name: string;
  cover?: { url: string };
  summary?: string;
}

interface GameSearchProps {
  onGameSelect: (game: Game) => void;
  selectedGameId?: string;
  placeholder?: string;
  className?: string;
}

export const GameSearch = ({
  onGameSelect,
  placeholder = "Buscar jogos (use IGDB)...",
  className,
}: GameSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = "game-search-listbox";

  const pickGame = useCallback(
    (game: Game) => {
      onGameSelect(game);
      setQuery("");
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onGameSelect]
  );

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSearching(false);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery("");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setIsOpen(true);

      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(
          `/api/igdb/search?q=${encodeURIComponent(trimmed)}&limit=10`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error(`IGDB proxy error: ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data?.results) ? data.results : [];
        setResults(items);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          console.error("Error searching games:", error);
        }
        setResults([]);
        setActiveIndex(-1);
      } finally {
        setIsSearching(false);
        abortRef.current = null;
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && results[activeIndex]) {
        pickGame(results[activeIndex]);
      }
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = isOpen && query.trim().length >= 2;
  const showEmpty = showDropdown && !isSearching && results.length === 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        showDropdown && "z-50",
        className
      )}
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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
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
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((game, index) => {
            const imageUrl = game.cover?.url
              ? `https:${game.cover.url}`
              : "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";

            return (
              <li
                key={game.id}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pickGame(game)}
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left transition-colors",
                    index === activeIndex
                      ? "bg-accent text-foreground"
                      : "hover:bg-accent/80"
                  )}
                >
                  <img
                    src={imageUrl}
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
            );
          })}
        </ul>
      )}

      {showEmpty && (
        <div
          className="autocomplete-dropdown absolute z-50 mt-2 w-full rounded-lg border border-border bg-card p-4 shadow-lg"
          role="status"
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="text-center text-sm text-muted-foreground">
            Nenhum jogo encontrado
          </p>
        </div>
      )}
    </div>
  );
};
