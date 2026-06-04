"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { StoreChannelConfigDto } from "@server/store/store.types";

export function useStoreConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<StoreChannelConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.getConfig();
      setConfig(data);
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

  const save = async (patch: Partial<StoreChannelConfigDto>) => {
    setSaving(true);
    try {
      const updated = await services.store.updateConfig(patch);
      setConfig(updated);
      toast({ title: "Configurações salvas" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, saving, save, reload: load };
}
