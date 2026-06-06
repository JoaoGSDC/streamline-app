"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { services } from "@services";
import { createImageUrlFormatter } from "@utils/factories/create-image-url-formatter";
import type { GameSearchProps, GameSearchResult } from "@features/search/types/search.types";

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

const formatImageUrl = createImageUrlFormatter();

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";

export function useGameSearch({
  onGameSelect,
  recentSuggestions = [],
}: Pick<GameSearchProps, "onGameSelect" | "recentSuggestions">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickGame = useCallback(
    (game: GameSearchResult) => {
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

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setIsOpen(true);
      return;
    }
    if (recentSuggestions.length > 0) {
      setIsOpen(true);
      setActiveIndex(0);
    }
  }, [query, recentSuggestions.length]);

  const handleOptionHover = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const getCoverUrl = useCallback((game: GameSearchResult): string => {
    if (!game.cover?.url) return FALLBACK_COVER;
    return formatImageUrl(game.cover.url);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      const inputFocused = document.activeElement === inputRef.current;
      if (recentSuggestions.length > 0 && inputFocused) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setIsOpen(true);

      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const searchResults = await services.igdb.games.search(
          trimmedQuery,
          10,
          controller.signal
        );

        setResults(searchResults);
        setActiveIndex(searchResults.length > 0 ? 0 : -1);
      } catch (searchError) {
        if ((searchError as Error)?.name !== "AbortError") {
          console.error("Error searching games:", searchError);
        }
        setResults([]);
        setActiveIndex(-1);
      } finally {
        setIsSearching(false);
        abortRef.current = null;
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, recentSuggestions.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      setActiveIndex(-1);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const isSearchingMode = query.trim().length >= MIN_QUERY_LENGTH;
  const dropdownItems = isSearchingMode ? results : recentSuggestions;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (isOpen && activeIndex >= 0 && dropdownItems[activeIndex]) {
          pickGame(dropdownItems[activeIndex]);
        }
        return;
      }

      if (!isOpen || dropdownItems.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((previous) => (previous + 1) % dropdownItems.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((previous) =>
          previous <= 0 ? dropdownItems.length - 1 : previous - 1
        );
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [activeIndex, dropdownItems, isOpen, pickGame]
  );
  const showDropdown = isOpen && dropdownItems.length > 0;
  const showEmpty =
    isOpen && isSearchingMode && !isSearching && results.length === 0;
  const showRecentHeader = isOpen && !isSearchingMode && recentSuggestions.length > 0;

  return {
    query,
    results: dropdownItems,
    isSearching,
    isOpen,
    activeIndex,
    containerRef,
    inputRef,
    listboxId: "game-search-listbox",
    showDropdown,
    showEmpty,
    showRecentHeader,
    isSearchingMode,
    pickGame,
    clearSearch,
    handleQueryChange,
    handleInputFocus,
    handleKeyDown,
    handleOptionHover,
    getCoverUrl,
  };
}
