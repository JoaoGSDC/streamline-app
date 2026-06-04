"use client";

import { useState } from "react";
import { ExternalLink, Settings } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreConfigPage } from "@features/store/hooks/use-store-config.hook";
import { buildPixiePurchaseUrl } from "@server/store/store-product-utils";
import { useAdminContext } from "@/components/admin/AdminProvider";

export default function StoreConfigPage() {
  const { config, loading, saving, save } = useStoreConfigPage();
  const { actingAs } = useAdminContext();
  const [pixieDraft, setPixieDraft] = useState("");

  if (loading) {    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const effectivePixie =
    pixieDraft ||
    config?.pixieUsername ||
    actingAs?.twitchUsername ||
    "";
  const pixiePreviewUrl = effectivePixie
    ? buildPixiePurchaseUrl(effectivePixie)
    : null;

  return (    <div className="space-y-6">
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

          {config?.coinsAllowed && (
            <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div>
                <p className="font-medium">Compra de Coins via Pixie.gg</p>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  Viewers parceiros veem um fluxo para apoiar pelo Pixie e receber
                  Coins. Deixe em branco para usar seu username da Twitch (
                  {actingAs?.twitchUsername}).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pixie-username">Username no Pixie</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="pixie-username"
                    placeholder={actingAs?.twitchUsername ?? "seu_username"}
                    value={
                      pixieDraft ||
                      config.pixieUsername ||
                      ""
                    }
                    onChange={(e) => setPixieDraft(e.target.value)}
                    disabled={saving}
                  />
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      void save({
                        pixieUsername:
                          (pixieDraft || config?.pixieUsername || null)?.trim() ||
                          null,
                      });
                      setPixieDraft("");
                    }}
                  >
                    Salvar Pixie
                  </Button>
                </div>
                {pixiePreviewUrl && (
                  <a
                    href={pixiePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline"
                  >
                    Pré-visualizar {pixiePreviewUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

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
