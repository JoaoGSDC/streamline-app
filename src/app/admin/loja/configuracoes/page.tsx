"use client";

import { Settings } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreConfigPage } from "@features/store/hooks/use-store-config.hook";

export default function StoreConfigPage() {
  const { config, loading, saving, save } = useStoreConfigPage();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações"
        description="Controle a loja do canal. Coins só ficam disponíveis para streamers parceiros."
      />

      <AdminSection
        title="Loja"
        description="Ative ou desative a loja virtual do canal."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-outline-variant/30 p-4">
            <div>
              <p className="font-medium">Loja ativa</p>
              <p className="text-body-sm text-muted-foreground">
                Permite resgates de produtos no canal.
              </p>
            </div>
            <Switch
              checked={config?.enabled ?? false}
              disabled={saving}
              onCheckedChange={(v) => void save({ enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-outline-variant/30 p-4">
            <div>
              <p className="font-medium">Loja pública</p>
              <p className="text-body-sm text-muted-foreground">
                Exibe a página /store/seu-usuario para viewers.
              </p>
            </div>
            <Switch
              checked={config?.publicEnabled ?? false}
              disabled={saving || !config?.enabled}
              onCheckedChange={(v) => void save({ publicEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-outline-variant/30 p-4">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Modo de entrega padrão
              </p>
              <p className="text-body-sm text-muted-foreground">
                Usado quando o produto não define um modo específico.
              </p>
            </div>
            <Select
              value={config?.defaultFulfillmentMode ?? "manual"}
              disabled={saving}
              onValueChange={(v) =>
                void save({
                  defaultFulfillmentMode: v as "auto" | "manual" | "approval",
                })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="approval">Aprovação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low/30 p-4 text-body-sm">
            <p className="font-medium">Coins na loja</p>
            <p className="mt-1 text-muted-foreground">
              {config?.coinsAllowed
                ? "Seu canal é parceiro — produtos podem aceitar Coins."
                : "Coins não disponíveis — apenas streamers parceiros podem usar Coins na loja."}
            </p>
            <p className="mt-2 text-body-xs text-muted-foreground">
              Versão da config: {config?.configVersion ?? 1}
            </p>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}
