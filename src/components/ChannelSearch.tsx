"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TwitchChannelResult } from "@/lib/twitch-api";

interface ChannelSearchProps {
  className?: string;
  placeholder?: string;
}

export const ChannelSearch = ({
  className,
  placeholder = "Buscar canal na Twitch...",
}: ChannelSearchProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TwitchChannelResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = "twitch-channel-search-listbox";

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setQuery("");
    setResults([]);
    setIsSearching(false);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const navigateToChannel = useCallback(
    (login: string) => {
      if (!login) return;
      clearSearch();
      router.push(`/${login.toLowerCase()}`);
    },
    [clearSearch, router]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
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
          `/api/twitch/channels/search?q=${encodeURIComponent(query.trim())}&limit=8`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`Twitch search error: ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data?.results) ? data.results : [];
        setResults(items);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          console.error("Error searching Twitch channels:", error);
        }
        setResults([]);
        setActiveIndex(-1);
      } finally {
        setIsSearching(false);
        abortRef.current = null;
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        navigateToChannel(query.trim().toLowerCase());
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateToChannel(results[activeIndex].login);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = isOpen && query.trim().length >= 2;
  const showEmpty =
    showDropdown && !isSearching && results.length === 0;

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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
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
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigateToChannel(channel.login)}
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
};
