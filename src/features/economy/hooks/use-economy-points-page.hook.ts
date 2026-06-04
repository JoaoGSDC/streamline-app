"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { EconomyFullConfigDto } from "@server/economy/economy.types";

const DEFAULT_POINTS = {
  pointsPerInterval: 10,
  intervalMinutes: 5,
  minMessagesPerInterval: 1,
  subscriberMultiplier: 2,
  vipMultiplier: 1.5,
  moderatorMultiplier: 1,
  dailyPointsCap: null as number | null,
  earnMessageEnabled: false,
  earnMessageTemplate: "{displayName} ganhou {points} pontos!",
};

export function useEconomyPointsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EconomyFullConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_POINTS);
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [publicRanking, setPublicRanking] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.economy.getConfig();
      setConfig(data);
      setForm({
        pointsPerInterval: data.points.pointsPerInterval,
        intervalMinutes: data.points.intervalMinutes,
        minMessagesPerInterval: data.points.minMessagesPerInterval,
        subscriberMultiplier: data.points.subscriberMultiplier,
        vipMultiplier: data.points.vipMultiplier,
        moderatorMultiplier: data.points.moderatorMultiplier,
        dailyPointsCap: data.points.dailyPointsCap,
        earnMessageEnabled: data.points.earnMessageEnabled,
        earnMessageTemplate:
          data.points.earnMessageTemplate ??
          "{displayName} ganhou {points} pontos!",
      });
      setPointsEnabled(data.general.pointsEnabled);
      setPublicRanking(data.general.publicRankingEnabled);
    } catch {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as configurações de pontos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewSummary = useMemo(() => {
    const capText =
      form.dailyPointsCap != null
        ? ` Limite diário: ${form.dailyPointsCap} pontos.`
        : " Sem limite diário.";
    return `Usuário ganha ${form.pointsPerInterval} pontos a cada ${form.intervalMinutes} minuto${form.intervalMinutes === 1 ? "" : "s"} (mínimo ${form.minMessagesPerInterval} mensagem${form.minMessagesPerInterval === 1 ? "" : "ns"}). Inscritos recebem ${form.subscriberMultiplier}x, VIPs ${form.vipMultiplier}x e moderadores ${form.moderatorMultiplier}x.${capText}`;
  }, [form]);

  const save = async () => {
    setSaving(true);
    try {
      await services.economy.updateGeneral({
        pointsEnabled,
        publicRankingEnabled: publicRanking,
      });
      await services.economy.updatePoints({
        ...form,
        dailyPointsCap: form.dailyPointsCap,
      });
      toast({
        title: "Configurações salvas",
        description: "As regras de pontos foram atualizadas.",
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

  return {
    config,
    form,
    setForm,
    pointsEnabled,
    setPointsEnabled,
    publicRanking,
    setPublicRanking,
    loading,
    saving,
    previewSummary,
    save,
  };
}
