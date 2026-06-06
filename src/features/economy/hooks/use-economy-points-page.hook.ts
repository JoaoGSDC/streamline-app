"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type PointsForm = typeof DEFAULT_POINTS;

function buildSnapshot(
  form: PointsForm,
  pointsEnabled: boolean,
  publicRanking: boolean
) {
  return JSON.stringify({ form, pointsEnabled, publicRanking });
}

function getDirtySections(
  form: PointsForm,
  pointsEnabled: boolean,
  publicRanking: boolean,
  baseline: EconomyFullConfigDto | null
) {
  if (!baseline) return new Set<string>();

  const dirty = new Set<string>();
  const { general, points } = baseline;

  if (
    pointsEnabled !== general.pointsEnabled ||
    publicRanking !== general.publicRankingEnabled
  ) {
    dirty.add("activation");
  }
  if (
    form.pointsPerInterval !== points.pointsPerInterval ||
    form.intervalMinutes !== points.intervalMinutes ||
    form.minMessagesPerInterval !== points.minMessagesPerInterval
  ) {
    dirty.add("watchTime");
  }
  if (
    form.subscriberMultiplier !== points.subscriberMultiplier ||
    form.vipMultiplier !== points.vipMultiplier ||
    form.moderatorMultiplier !== points.moderatorMultiplier
  ) {
    dirty.add("multipliers");
  }
  if (form.dailyPointsCap !== points.dailyPointsCap) {
    dirty.add("dailyCap");
  }
  if (
    form.earnMessageEnabled !== points.earnMessageEnabled ||
    form.earnMessageTemplate !==
      (points.earnMessageTemplate ?? "{displayName} ganhou {points} pontos!")
  ) {
    dirty.add("earnMessage");
  }

  return dirty;
}

export function useEconomyPointsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EconomyFullConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [form, setForm] = useState(DEFAULT_POINTS);
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [publicRanking, setPublicRanking] = useState(true);
  const savedSnapshotRef = useRef("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.economy.getConfig();
      setConfig(data);
      const nextForm = {
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
      };
      setForm(nextForm);
      setPointsEnabled(data.general.pointsEnabled);
      setPublicRanking(data.general.publicRankingEnabled);
      savedSnapshotRef.current = buildSnapshot(
        nextForm,
        data.general.pointsEnabled,
        data.general.publicRankingEnabled
      );
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

  const dirtySections = useMemo(
    () => getDirtySections(form, pointsEnabled, publicRanking, config),
    [form, pointsEnabled, publicRanking, config]
  );

  const isDirty = dirtySections.size > 0;

  const previewSummary = useMemo(() => {
    const mode =
      form.minMessagesPerInterval === 0 ? "Modo passivo" : "Modo ativo";
    const pts = `${form.pointsPerInterval} pts a cada ${form.intervalMinutes} min`;
    const sub = `Inscritos ${form.subscriberMultiplier.toFixed(1)}×`;
    const cap =
      form.dailyPointsCap != null
        ? `Limite ${form.dailyPointsCap}/dia`
        : "Sem limite diário";
    return `${mode} · ${pts} · ${sub} · ${cap}`;
  }, [form]);

  const saveAll = useCallback(async () => {
    if (!isDirty) return;
    setSaving(true);
    setSavedRecently(false);
    try {
      if (dirtySections.has("activation")) {
        await services.economy.updateGeneral({
          ...(pointsEnabled
            ? { enabled: true, pointsEnabled: true }
            : { pointsEnabled: false }),
          publicRankingEnabled: publicRanking,
        });
      }
      if (dirtySections.has("watchTime")) {
        await services.economy.updatePoints({
          pointsPerInterval: form.pointsPerInterval,
          intervalMinutes: form.intervalMinutes,
          minMessagesPerInterval: form.minMessagesPerInterval,
        });
      }
      if (dirtySections.has("multipliers")) {
        await services.economy.updatePoints({
          subscriberMultiplier: form.subscriberMultiplier,
          vipMultiplier: form.vipMultiplier,
          moderatorMultiplier: form.moderatorMultiplier,
        });
      }
      if (dirtySections.has("dailyCap")) {
        await services.economy.updatePoints({
          dailyPointsCap: form.dailyPointsCap,
        });
      }
      if (dirtySections.has("earnMessage")) {
        await services.economy.updatePoints({
          earnMessageEnabled: form.earnMessageEnabled,
          earnMessageTemplate: form.earnMessageTemplate,
        });
      }
      toast({
        title: "Alterações salvas",
        description: "Configurações de pontos atualizadas.",
      });
      await load();
      setSavedRecently(true);
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique os valores e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [
    dirtySections,
    form,
    isDirty,
    load,
    pointsEnabled,
    publicRanking,
    toast,
  ]);

  useEffect(() => {
    if (isDirty) {
      setSavedRecently(false);
    }
  }, [isDirty]);

  useEffect(() => {
    if (!savedRecently) return;
    const timer = setTimeout(() => setSavedRecently(false), 3000);
    return () => clearTimeout(timer);
  }, [savedRecently]);

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
    isDirty,
    savedRecently,
    previewSummary,
    saveAll,
  };
}
