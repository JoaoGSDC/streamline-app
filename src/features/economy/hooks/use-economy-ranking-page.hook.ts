"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { EconomyRankingEntryDto } from "@server/economy/economy.types";

export function useEconomyRankingPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<EconomyRankingEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.economy.getRanking({
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast({
        title: "Erro ao carregar ranking",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, limit, page, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items,
    total,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    loading,
    reload: load,
  };
}
