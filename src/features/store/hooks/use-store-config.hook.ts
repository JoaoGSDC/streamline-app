"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type {
  StoreChannelConfigDto,
  StoreFulfillmentMode,
} from "@server/store/store.types";

interface StoreConfigForm {
  enabled: boolean;
  publicEnabled: boolean;
  defaultFulfillmentMode: StoreFulfillmentMode;
  pixieUsername: string;
}

function configToForm(config: StoreChannelConfigDto): StoreConfigForm {
  return {
    enabled: config.enabled,
    publicEnabled: config.publicEnabled,
    defaultFulfillmentMode: config.defaultFulfillmentMode,
    pixieUsername: config.pixieUsername ?? "",
  };
}

export function useStoreConfigPage() {
  const { toast } = useToast();
  const [baseline, setBaseline] = useState<StoreConfigForm | null>(null);
  const [form, setForm] = useState<StoreConfigForm | null>(null);
  const [coinsAllowed, setCoinsAllowed] = useState(false);
  const [configVersion, setConfigVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.getConfig();
      const nextForm = configToForm(data);
      setBaseline(nextForm);
      setForm(nextForm);
      setCoinsAllowed(data.coinsAllowed);
      setConfigVersion(data.configVersion);
    } catch {
      toast({
        title: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty = useMemo(() => {
    if (!baseline || !form) return false;
    return JSON.stringify(baseline) !== JSON.stringify(form);
  }, [baseline, form]);

  useEffect(() => {
    if (isDirty) setSavedRecently(false);
  }, [isDirty]);

  useEffect(() => {
    if (!savedRecently) return;
    const timer = setTimeout(() => setSavedRecently(false), 3000);
    return () => clearTimeout(timer);
  }, [savedRecently]);

  const patchForm = (patch: Partial<StoreConfigForm>) => {
    setForm((current) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!form || !isDirty) return;
    setSaving(true);
    setSavedRecently(false);
    try {
      const updated = await services.store.updateConfig({
        enabled: form.enabled,
        publicEnabled: form.publicEnabled,
        defaultFulfillmentMode: form.defaultFulfillmentMode,
        pixieUsername: form.pixieUsername.trim() || null,
      });
      const nextForm = configToForm(updated);
      setBaseline(nextForm);
      setForm(nextForm);
      setCoinsAllowed(updated.coinsAllowed);
      setConfigVersion(updated.configVersion);
      setSavedRecently(true);
      toast({ title: "Configurações salvas" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    coinsAllowed,
    configVersion,
    loading,
    saving,
    isDirty,
    savedRecently,
    patchForm,
    save,
    reload: load,
  };
}
