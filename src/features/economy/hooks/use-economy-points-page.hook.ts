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

export type EconomyPointsSaveSection =
  | "activation"
  | "watchTime"
  | "multipliers"
  | "dailyCap"
  | "earnMessage";

export function useEconomyPointsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EconomyFullConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<EconomyPointsSaveSection | null>(
    null
  );
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
    const modeText =
      form.minMessagesPerInterval === 0
        ? "Modo passivo: pontos para quem está no chat (via lista de chatters do bot), sem precisar digitar."
        : `Modo ativo: exige pelo menos ${form.minMessagesPerInterval} mensagem${form.minMessagesPerInterval === 1 ? "" : "ns"} por intervalo (comandos ! não contam).`;
    return `${modeText} Usuário ganha ${form.pointsPerInterval} pontos a cada ${form.intervalMinutes} minuto${form.intervalMinutes === 1 ? "" : "s"}. Inscritos ${form.subscriberMultiplier}x, VIPs ${form.vipMultiplier}x, moderadores ${form.moderatorMultiplier}x.${capText}`;
  }, [form]);

  const isSaving = (section: EconomyPointsSaveSection) => savingSection === section;

  const saveActivation = async () => {
    setSavingSection("activation");
    try {
      await services.economy.updateGeneral({
        ...(pointsEnabled
          ? { enabled: true, pointsEnabled: true }
          : { pointsEnabled: false }),
        publicRankingEnabled: publicRanking,
      });
      toast({
        title: "Ativação salva",
        description: "Distribuição de pontos e ranking público atualizados.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a ativação.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const saveWatchTime = async () => {
    setSavingSection("watchTime");
    try {
      await services.economy.updatePoints({
        pointsPerInterval: form.pointsPerInterval,
        intervalMinutes: form.intervalMinutes,
        minMessagesPerInterval: form.minMessagesPerInterval,
      });
      toast({
        title: "Ganhos por tempo salvos",
        description: "Intervalo e mensagens mínimas atualizados.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique os valores e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const saveMultipliers = async () => {
    setSavingSection("multipliers");
    try {
      await services.economy.updatePoints({
        subscriberMultiplier: form.subscriberMultiplier,
        vipMultiplier: form.vipMultiplier,
        moderatorMultiplier: form.moderatorMultiplier,
      });
      toast({
        title: "Multiplicadores salvos",
        description: "Bônus de inscritos, VIPs e moderadores atualizados.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique os valores e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const saveDailyCap = async () => {
    setSavingSection("dailyCap");
    try {
      await services.economy.updatePoints({
        dailyPointsCap: form.dailyPointsCap,
      });
      toast({
        title: "Limite diário salvo",
        description: "Teto de pontos por dia atualizado.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique o valor e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const saveEarnMessage = async () => {
    setSavingSection("earnMessage");
    try {
      await services.economy.updatePoints({
        earnMessageEnabled: form.earnMessageEnabled,
        earnMessageTemplate: form.earnMessageTemplate,
      });
      toast({
        title: "Mensagem salva",
        description: "Configuração de aviso no chat atualizada.",
      });
      await load();
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique o texto e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
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
    isSaving,
    previewSummary,
    saveActivation,
    saveWatchTime,
    saveMultipliers,
    saveDailyCap,
    saveEarnMessage,
  };
}
