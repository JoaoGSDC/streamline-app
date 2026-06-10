"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { services } from "@services";
import type { QuotesChannelConfigDto } from "@server/quotes/quotes.types";
import { toast } from "sonner";

export default function QuotesSettingsPage() {
  const [config, setConfig] = useState<QuotesChannelConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.quotes.getConfig();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const patch = async (payload: Partial<QuotesChannelConfigDto>) => {
    setSaving(true);
    try {
      const updated = await services.quotes.updateConfig(payload);
      setConfig(updated);
      toast.success("Configurações salvas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações de Quotes"
        description="Controle o módulo e a captura automática de contexto da live."
      />

      <Card>
        <CardHeader>
          <CardTitle>Módulo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="quotes-enabled">Quotes ativas</Label>
              <p className="text-caption text-muted-foreground">
                Desative para bloquear criação e comandos de quote.
              </p>
            </div>
            <Switch
              id="quotes-enabled"
              checked={config?.enabled ?? true}
              disabled={loading || saving}
              onCheckedChange={(checked) => void patch({ enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="quotes-auto-context">Captura automática de contexto</Label>
              <p className="text-caption text-muted-foreground">
                O bot registra jogo, título e duração da live ao criar via comando.
              </p>
            </div>
            <Switch
              id="quotes-auto-context"
              checked={config?.autoCaptureContext ?? true}
              disabled={loading || saving}
              onCheckedChange={(checked) => void patch({ autoCaptureContext: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
