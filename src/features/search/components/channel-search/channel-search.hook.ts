"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { services } from "@services";
import type {
  ChannelSearchProps,
  ChannelSearchResult,
} from "@features/search/types/search.types";

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function useChannelSearch(_props: ChannelSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setIsOpen(true);
    }
  }, [query]);

  const handleOptionHover = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleChannelSelect = useCallback(
    (login: string) => {
      navigateToChannel(login);
    },
    [navigateToChannel]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < MIN_QUERY_LENGTH) {
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

        const searchResults = await services.twitch.channels.search(
          trimmedQuery,
          8,
          controller.signal
        );

        setResults(searchResults);
        setActiveIndex(searchResults.length > 0 ? 0 : -1);
      } catch (searchError) {
        if ((searchError as Error)?.name !== "AbortError") {
          console.error("Error searching Twitch channels:", searchError);
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
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
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

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) {
        if (event.key === "Enter" && query.trim().length >= MIN_QUERY_LENGTH) {
          navigateToChannel(query.trim().toLowerCase());
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((previous) => (previous + 1) % results.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((previous) =>
          previous <= 0 ? results.length - 1 : previous - 1
        );
        return;
      }

      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        navigateToChannel(results[activeIndex].login);
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [activeIndex, isOpen, navigateToChannel, query, results]
  );

  const showDropdown = isOpen && query.trim().length >= MIN_QUERY_LENGTH;
  const showEmpty = showDropdown && !isSearching && results.length === 0;

  return {
    query,
    results,
    isSearching,
    containerRef,
    listboxId: "twitch-channel-search-listbox",
    showDropdown,
    showEmpty,
    activeIndex,
    clearSearch,
    handleQueryChange,
    handleInputFocus,
    handleKeyDown,
    handleOptionHover,
    handleChannelSelect,
  };
}
