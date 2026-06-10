"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { services } from "@services";
import type { CountersChannelConfigDto } from "@server/counters/counters.types";

export default function CountersSettingsPage() {
  const [config, setConfig] = useState<CountersChannelConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.counters.getConfig();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleEnabled = async (enabled: boolean) => {
    setSaving(true);
    try {
      const updated = await services.counters.updateConfig({ enabled });
      setConfig(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações"
        description="Ative ou desative o módulo de contadores no canal."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-body-md">Módulo de contadores</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="counters-enabled">Contadores ativos</Label>
            <p className="text-body-sm text-muted-foreground">
              Quando desativado, ajustes via painel e bot são bloqueados.
            </p>
          </div>
          <Switch
            id="counters-enabled"
            checked={config?.enabled ?? true}
            disabled={loading || saving}
            onCheckedChange={(checked) => void toggleEnabled(checked)}
          />
        </CardContent>
      </Card>

      {config ? (
        <p className="text-caption text-muted-foreground">
          Versão da config: {config.configVersion}
        </p>
      ) : null}
    </div>
  );
}
