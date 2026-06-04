"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type {
  EconomyFullConfigDto,
  EconomyLevelDefinition,
} from "@server/economy/economy.types";

export function useEconomyLevelsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EconomyFullConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levelsEnabled, setLevelsEnabled] = useState(false);
  const [xpPerMessage, setXpPerMessage] = useState(5);
  const [xpPerMinuteWatching, setXpPerMinuteWatching] = useState(1);
  const [xpFormula, setXpFormula] = useState<"linear" | "exponential" | "custom">(
    "linear"
  );
  const [levelsDefinition, setLevelsDefinition] = useState<
    EconomyLevelDefinition[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.economy.getConfig();
      setConfig(data);
      setLevelsEnabled(data.general.levelsEnabled);
      setXpPerMessage(data.levels.xpPerMessage);
      setXpPerMinuteWatching(data.levels.xpPerMinuteWatching);
      setXpFormula(data.levels.xpFormula);
      setLevelsDefinition(data.levels.levelsDefinition);
    } catch {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as configurações de níveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await services.economy.updateGeneral({ levelsEnabled });
      await services.economy.updateLevels({
        xpFormula,
        xpPerMessage,
        xpPerMinuteWatching,
        levelsDefinition,
      });
      toast({
        title: "Níveis atualizados",
        description: "As regras de XP e níveis foram salvas.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique os valores e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLevel = (
    index: number,
    patch: Partial<EconomyLevelDefinition>
  ) => {
    setLevelsDefinition((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  return {
    config,
    loading,
    saving,
    levelsEnabled,
    setLevelsEnabled,
    xpPerMessage,
    setXpPerMessage,
    xpPerMinuteWatching,
    setXpPerMinuteWatching,
    xpFormula,
    setXpFormula,
    levelsDefinition,
    updateLevel,
    save,
  };
}
