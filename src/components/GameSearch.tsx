"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface Game {
  id: number;
  name: string;
  cover?: { url: string };
  summary?: string;
}

interface GameSearchProps {
  onGameSelect: (game: Game) => void;
  selectedGameId?: string;
}

export const GameSearch = ({
  onGameSelect,
  selectedGameId,
}: GameSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (abortRef.current) {
          abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(
          `/api/igdb/search?q=${encodeURIComponent(query)}&limit=10`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          throw new Error(`IGDB proxy error: ${res.status}`);
        }
        const data = await res.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Error searching games:", error);
        }
        setResults([]);
      } finally {
        setIsSearching(false);
        abortRef.current = null;
      }
    }, 500);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [query]);

  // Fechar lista ao clicar fora / tecla ESC
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setResults([]);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleCancelSearch = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSearching(false);
    setResults([]);
    setQuery("");
  };

  const handleSelect = (game: Game) => {
    onGameSelect(game);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar jogos (use IGDB)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && !isSearching && (
          <button
            type="button"
            onClick={handleCancelSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-card border border-border  shadow-lg max-h-80 overflow-y-auto">
          {results.map((game) => {
            const imageUrl = game.cover?.url
              ? `https:${game.cover.url}`
              : "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";

            return (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
              >
                <img
                  src={imageUrl}
                  alt={game.name}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">{game.name}</p>
                  {game.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {game.summary}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {query && results.length === 0 && !isSearching && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-card border border-border  shadow-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            Nenhum jogo encontrado
          </p>
        </div>
      )}
    </div>
  );
};
