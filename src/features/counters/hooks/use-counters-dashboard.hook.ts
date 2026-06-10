"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type { CountersDashboardDto } from "@server/counters/counters.types";

export function useCountersDashboard() {
  const [dashboard, setDashboard] = useState<CountersDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.counters.getDashboard();
      setDashboard(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { dashboard, loading, reload };
}
