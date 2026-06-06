"use client";

import { ExternalLink } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/shared/AdminConfigSection";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSaveFooter } from "@/components/admin/shared/AdminSaveFooter";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const {
    form,
    coinsAllowed,
    configVersion,
    loading,
    saving,
    isDirty,
    savedRecently,
    patchForm,
    save,
  } = useStoreConfigPage();
  const { actingAs } = useAdminContext();

  if (loading || !form) {
    return (
      <div className="admin-page-stack">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const pixiePreviewUrl = buildPixiePurchaseUrl(
    form.pixieUsername.trim() || actingAs?.twitchUsername || ""
  );

  return (
    <div className="admin-page-stack pb-20">
      <AdminPageHeader
        title="Configurações"
        description="Controle a loja do canal. Coins só ficam disponíveis para streamers parceiros."
      />

      <div className="admin-config-stack">
        <AdminConfigSection
          title="Disponibilidade"
          description="Defina se a loja está ativa e visível para viewers."
          showDivider={false}
        >
          <div className="admin-subsection-stack">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-label font-medium">Loja ativa</p>
                <p className="text-caption">
                  Permite resgates de produtos no canal.
                </p>
              </div>
              <Switch
                checked={form.enabled}
                disabled={saving}
                onCheckedChange={(value) => patchForm({ enabled: value })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-label font-medium">Loja pública</p>
                <p className="text-caption">
                  Exibe a página /store/seu-usuario para viewers.
                </p>
              </div>
              <Switch
                checked={form.publicEnabled}
                disabled={saving || !form.enabled}
                onCheckedChange={(value) => patchForm({ publicEnabled: value })}
              />
            </div>
          </div>
        </AdminConfigSection>

        <AdminConfigSection
          title="Pagamentos"
          description="Configurações de moedas aceitas na loja."
        >
          <div className="rounded-lg bg-muted/30 p-4 text-label">
            <p className="font-medium">Coins na loja</p>
            <p className="mt-1 text-caption">
              {coinsAllowed
                ? "Seu canal é parceiro — produtos podem aceitar Coins."
                : "Coins não disponíveis — apenas streamers parceiros podem usar Coins na loja."}
            </p>
            <p className="mt-2 text-caption">
              Versão da config: {configVersion}
            </p>
          </div>
        </AdminConfigSection>

        <AdminConfigSection
          title="Entrega padrão"
          description="Modo usado quando o produto não define um modo específico."
        >
          <Select
            value={form.defaultFulfillmentMode}
            disabled={saving}
            onValueChange={(value) =>
              patchForm({
                defaultFulfillmentMode: value as typeof form.defaultFulfillmentMode,
              })
            }
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automática</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="approval">Aprovação</SelectItem>
            </SelectContent>
          </Select>
        </AdminConfigSection>

        {coinsAllowed && (
          <AdminConfigSection
            title="Integração Pixie.gg"
            description="Link de compra de Coins para viewers parceiros."
          >
            <div className="space-y-2">
              <Label htmlFor="pixie-username">Username no Pixie</Label>
              <Input
                id="pixie-username"
                placeholder={actingAs?.twitchUsername ?? "seu_username"}
                value={form.pixieUsername}
                disabled={saving}
                onChange={(e) => patchForm({ pixieUsername: e.target.value })}
              />
              <p className="text-caption">
                Deixe em branco para usar seu username da Twitch (
                {actingAs?.twitchUsername}).
              </p>
              {pixiePreviewUrl ? (
                <a
                  href={pixiePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-label text-primary hover:underline"
                >
                  Pré-visualizar link Pixie
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </AdminConfigSection>
        )}
      </div>

      <AdminSaveFooter
        dirty={isDirty}
        saving={saving}
        saved={savedRecently}
        onSave={() => void save()}
      />
    </div>
  );
}
