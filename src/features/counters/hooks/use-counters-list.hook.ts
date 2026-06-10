"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type {
  CounterCategoryDto,
  CounterDto,
  CounterOperation,
} from "@server/counters/counters.types";

export function useCountersList() {
  const [counters, setCounters] = useState<CounterDto[]>([]);
  const [categories, setCategories] = useState<CounterCategoryDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const [countersResult, categoriesResult] = await Promise.all([
        services.counters.listCounters({
          q: q?.trim() || undefined,
          status: "active",
        }),
        services.counters.listCategories(),
      ]);
      setCounters(countersResult.items);
      setCategories(categoriesResult.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(search);
  }, [reload, search]);

  const createCounter = useCallback(
    async (payload: Parameters<typeof services.counters.createCounter>[0]) => {
      setSaving(true);
      try {
        const created = await services.counters.createCounter(payload);
        await reload(search);
        return created;
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  const adjustCounter = useCallback(
    async (id: string, operation: CounterOperation, amount?: number) => {
      setSaving(true);
      try {
        const updated = await services.counters.adjustCounter(id, { operation, amount });
        setCounters((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const archiveCounter = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        await services.counters.archiveCounter(id);
        await reload(search);
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  const duplicateCounter = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const duplicated = await services.counters.duplicateCounter(id);
        await reload(search);
        return duplicated;
      } finally {
        setSaving(false);
      }
    },
    [reload, search]
  );

  return {
    counters,
    categories,
    search,
    setSearch,
    loading,
    saving,
    reload,
    createCounter,
    adjustCounter,
    archiveCounter,
    duplicateCounter,
  };
}
