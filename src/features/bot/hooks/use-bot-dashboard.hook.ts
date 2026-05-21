"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type { BotStatusResponse } from "@services/entities/bot-status.services";

export function useBotDashboard() {
  const [status, setStatus] = useState<BotStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await services.botStatus.get();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    status,
    loading,
    refreshing,
    refresh: () => load(true),
  };
}
