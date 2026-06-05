"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { EconomyOverviewDto } from "@server/economy/economy.types";

export function useEconomyOverviewPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<EconomyOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.economy.getOverview();
      setOverview(data);
    } catch {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar a visão geral da pontuação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleEnabled = async (enabled: boolean) => {
    setSaving(true);
    try {
      await services.economy.updateGeneral(
        enabled
          ? {
              enabled: true,
              pointsEnabled: true,
              levelsEnabled: true,
            }
          : { enabled: false }
      );
      toast({
        title: enabled ? "Pontuação ativada" : "Pontuação desativada",
        description: enabled
          ? "Pontos e níveis foram habilitados. O bot precisa de STREAMLINE_APP_URL + BOT_SERVICE_TOKEN no .env."
          : "Nenhum ponto ou XP novo será distribuído enquanto estiver desligado.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return { overview, loading, saving, reload: load, toggleEnabled };
}
