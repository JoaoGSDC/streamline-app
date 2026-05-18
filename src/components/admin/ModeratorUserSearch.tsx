"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TwitchChannelResult } from "@/lib/twitch-api";

export interface ModeratorUserSearchProps {
  value: string;
  onChange: (login: string) => void;
  onSelect?: (channel: TwitchChannelResult) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Logins que não devem aparecer (dono do canal, moderadores já cadastrados) */
  excludeLogins?: string[];
}

export function ModeratorUserSearch({
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = "Buscar usuário na Twitch...",
  className,
  excludeLogins = [],
}: ModeratorUserSearchProps) {
  const [results, setResults] = useState<TwitchChannelResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = "moderator-user-search-listbox";

  const excludedKey = excludeLogins
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(",");
  const excluded = useMemo(
    () => new Set(excludedKey ? excludedKey.split(",") : []),
    [excludedKey]
  );

  const pickChannel = useCallback(
    (channel: TwitchChannelResult) => {
      onChange(channel.login);
      onSelect?.(channel);
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onChange, onSelect]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) {
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
          `/api/twitch/channels/search?q=${encodeURIComponent(trimmed)}&limit=8`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`Twitch search error: ${res.status}`);

        const data = await res.json();
        const items = (Array.isArray(data?.results) ? data.results : []).filter(
          (ch: TwitchChannelResult) => !excluded.has(ch.login.toLowerCase())
        );
        setResults(items);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          console.error("Error searching Twitch users:", error);
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
  }, [value, excluded]);

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
      pickChannel(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = isOpen && value.trim().length >= 2;
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
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-10 border-outline-variant/40 bg-surface-container-low/80 pl-10 pr-10 text-body-sm"
          autoComplete="off"
          aria-label="Buscar usuário Twitch para moderador"
          aria-autocomplete="list"
        />
        {value && !isSearching && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange("");
              setResults([]);
              setIsOpen(false);
              setActiveIndex(-1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
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
          className="autocomplete-dropdown absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-lg py-1"
          role="listbox"
        >
          {results.map((channel, index) => (
            <li
              key={channel.id}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pickChannel(channel)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  index === activeIndex
                    ? "bg-surface-container-highest text-foreground"
                    : "hover:bg-surface-container-highest/80"
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
          className="autocomplete-dropdown absolute z-50 mt-2 w-full rounded-lg p-4"
          role="status"
        >
          <p className="text-center text-body-sm text-muted-foreground">
            Nenhum usuário encontrado
          </p>
        </div>
      )}
    </div>
  );
}
