"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type { QuoteCategoryDto, QuoteDto } from "@server/quotes/quotes.types";

export function useQuotesLibrary() {
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [categories, setCategories] = useState<QuoteCategoryDto[]>([]);
  const [selected, setSelected] = useState<QuoteDto | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);

  const reload = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const [quotesResult, categoriesResult] = await Promise.all([
        services.quotes.listQuotes({
          q: q?.trim() || undefined,
          limit: 100,
        }),
        services.quotes.listCategories(),
      ]);
      setQuotes(quotesResult.items);
      setTotal(quotesResult.total);
      setCategories(categoriesResult.items);
      setSelected((current) => {
        if (!current) return quotesResult.items[0] ?? null;
        return quotesResult.items.find((item) => item.id === current.id) ?? quotesResult.items[0] ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(search);
  }, [reload, search]);

  const createQuote = useCallback(
    async (payload: {
      text: string;
      speakerName: string;
      categoryId?: string | null;
      tagSlugs?: string[];
    }) => {
      setSaving(true);
      try {
        const created = await services.quotes.createQuote(payload);
        await reload(search);
        setSelected(created);
        return created;
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  const updateQuote = useCallback(
    async (id: string, payload: Parameters<typeof services.quotes.updateQuote>[1]) => {
      setSaving(true);
      try {
        const updated = await services.quotes.updateQuote(id, payload);
        await reload(search);
        setSelected(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  const archiveQuote = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        await services.quotes.archiveQuote(id);
        await reload(search);
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  const deleteQuote = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        await services.quotes.deleteQuote(id);
        setSelected(null);
        await reload(search);
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  return {
    quotes,
    categories,
    selected,
    setSelected,
    search,
    setSearch,
    loading,
    saving,
    total,
    reload,
    createQuote,
    updateQuote,
    archiveQuote,
    deleteQuote,
  };
}
