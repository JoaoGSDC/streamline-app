"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type { QuotesDashboardDto } from "@server/quotes/quotes.types";

export function useQuotesDashboard() {
  const [dashboard, setDashboard] = useState<QuotesDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.quotes.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { dashboard, loading, error, reload };
}
