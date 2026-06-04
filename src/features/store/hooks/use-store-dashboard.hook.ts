"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { StoreDashboardDto } from "@server/store/store.types";

export function useStoreDashboard() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<StoreDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.getDashboard();
      setDashboard(data);
    } catch {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o dashboard da loja.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return { dashboard, loading, reload: load };
}
