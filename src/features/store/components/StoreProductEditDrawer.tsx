"use client";

import { useEffect, useState } from "react";
import { AdminAdvancedSection } from "@/components/admin/shared/AdminAdvancedSection";
import { AdminConfigSection } from "@/components/admin/shared/AdminConfigSection";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StoreCategoryDto } from "@server/store/store.types";
import {
  STORE_PRODUCT_TYPE_LABELS,
  STORE_RARITY_LABELS,
  type StoreFulfillmentMode,
  type StorePriceMode,
  type StoreProductRarity,
  type StoreProductStatus,
  type StoreProductType,
} from "@server/store/store.types";
import type { StoreProductRowState } from "@features/store/types/store-product.types";

interface StoreProductEditDrawerProps {
  open: boolean;
  product: StoreProductRowState | null;
  categories: StoreCategoryDto[];
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: StoreProductRowState) => void;
  onDiscardDraft?: () => void;
}

export function StoreProductEditDrawer({
  open,
  product,
  categories,
  saving = false,
  onOpenChange,
  onSave,
  onDiscardDraft,
}: StoreProductEditDrawerProps) {
  const [draft, setDraft] = useState<StoreProductRowState | null>(null);

  useEffect(() => {
    if (product) setDraft({ ...product });
  }, [product]);

  if (!product || !draft) return null;

  const patch = (changes: Partial<StoreProductRowState>) => {
    setDraft((current) => (current ? { ...current, ...changes } : current));
  };

  const isArchived = draft.status === "archived";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[560px] max-w-[560px] flex-col gap-0 p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="border-b border-outline-variant/20 px-6 py-5 text-left">
          <SheetTitle className="text-section-title">
            {draft.isDraft ? "Novo produto" : "Editar produto"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="admin-config-stack">
            <AdminConfigSection title="Informações básicas" showDivider={false}>
              <div className="admin-subsection-stack">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Nome</Label>
                  <Input
                    id="product-name"
                    value={draft.name}
                    disabled={saving || isArchived}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-short-desc">Descrição curta</Label>
                  <Input
                    id="product-short-desc"
                    value={draft.shortDescription}
                    disabled={saving || isArchived}
                    onChange={(e) => patch({ shortDescription: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-image">URL da imagem</Label>
                  <Input
                    id="product-image"
                    value={draft.imageUrl}
                    disabled={saving || isArchived}
                    onChange={(e) => patch({ imageUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={draft.categoryId}
                      disabled={saving || isArchived}
                      onValueChange={(value) => patch({ categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Raridade</Label>
                    <Select
                      value={draft.rarity || "none"}
                      disabled={saving || isArchived}
                      onValueChange={(value) =>
                        patch({
                          rarity:
                            value === "none" ? "" : (value as StoreProductRarity),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {Object.entries(STORE_RARITY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AdminConfigSection>

            <AdminConfigSection title="Preço e estoque">
              <div className="admin-subsection-stack">
                <div className="space-y-2">
                  <Label>Tipo de preço</Label>
                  <Select
                    value={draft.priceMode}
                    disabled={saving || isArchived}
                    onValueChange={(value) =>
                      patch({ priceMode: value as StorePriceMode })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points_only">Apenas Points</SelectItem>
                      <SelectItem value="coins_only">Apenas Coins</SelectItem>
                      <SelectItem value="combined">Points + Coins</SelectItem>
                      <SelectItem value="either">Points ou Coins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-points">Preço (Points)</Label>
                    <Input
                      id="product-points"
                      type="number"
                      min={0}
                      value={draft.pricePoints}
                      disabled={saving || isArchived}
                      onChange={(e) =>
                        patch({ pricePoints: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-coins">Preço (Coins)</Label>
                    <Input
                      id="product-coins"
                      type="number"
                      min={0}
                      value={draft.priceCoins}
                      disabled={saving || isArchived}
                      onChange={(e) =>
                        patch({ priceCoins: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <p className="text-label font-medium">Estoque ilimitado</p>
                  <Switch
                    checked={draft.stockUnlimited}
                    disabled={saving || isArchived}
                    onCheckedChange={(value) => patch({ stockUnlimited: value })}
                  />
                </div>
                {!draft.stockUnlimited && (
                  <div className="space-y-2">
                    <Label htmlFor="product-stock">Quantidade em estoque</Label>
                    <Input
                      id="product-stock"
                      type="number"
                      min={0}
                      value={draft.stockQuantity}
                      disabled={saving || isArchived}
                      onChange={(e) =>
                        patch({
                          stockQuantity: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </AdminConfigSection>

            <AdminConfigSection title="Entrega">
              <div className="admin-subsection-stack">
                <div className="space-y-2">
                  <Label>Modo de entrega</Label>
                  <Select
                    value={draft.fulfillmentMode}
                    disabled={saving || isArchived}
                    onValueChange={(value) =>
                      patch({ fulfillmentMode: value as StoreFulfillmentMode })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automática</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="approval">Fila de aprovação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-instructions">Instruções de entrega</Label>
                  <Textarea
                    id="product-instructions"
                    rows={3}
                    value={draft.fulfillmentInstructions}
                    disabled={saving || isArchived}
                    onChange={(e) =>
                      patch({ fulfillmentInstructions: e.target.value })
                    }
                    placeholder="Como o viewer recebe ou resgata este item…"
                  />
                </div>
              </div>
            </AdminConfigSection>

            <AdminConfigSection title="Visibilidade">
              <div className="admin-subsection-stack">
                <div className="flex items-center justify-between">
                  <Label>Produto ativo</Label>
                  <Switch
                    checked={draft.status === "active"}
                    disabled={saving || isArchived}
                    onCheckedChange={(active) =>
                      patch({ status: active ? "active" : "inactive" })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Destacar na loja</Label>
                  <Switch
                    checked={draft.featured}
                    disabled={saving || isArchived}
                    onCheckedChange={(value) => patch({ featured: value })}
                  />
                </div>
                {!draft.isDraft && (
                  <div className="space-y-2">
                    <Label>Status do produto</Label>
                    <Select
                      value={draft.status}
                      disabled={saving}
                      onValueChange={(value) =>
                        patch({ status: value as StoreProductStatus })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AdminConfigSection>

            <AdminAdvancedSection summary="Opções avançadas">
              <div className="admin-subsection-stack">
                <div className="space-y-2">
                  <Label>Tipo de produto</Label>
                  <Select
                    value={draft.productType}
                    disabled={saving || isArchived}
                    onValueChange={(value) =>
                      patch({ productType: value as StoreProductType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STORE_PRODUCT_TYPE_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-full-desc">Descrição completa</Label>
                  <Textarea
                    id="product-full-desc"
                    rows={4}
                    value={draft.fullDescription}
                    disabled={saving || isArchived}
                    onChange={(e) => patch({ fullDescription: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-label">
                    <input
                      type="checkbox"
                      checked={draft.subscribersOnly}
                      disabled={saving || isArchived}
                      onChange={(e) => patch({ subscribersOnly: e.target.checked })}
                      className="rounded border-input"
                    />
                    Apenas inscritos
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-label">
                    <input
                      type="checkbox"
                      checked={draft.vipOnly}
                      disabled={saving || isArchived}
                      onChange={(e) => patch({ vipOnly: e.target.checked })}
                      className="rounded border-input"
                    />
                    Apenas VIPs
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-label">
                    <input
                      type="checkbox"
                      checked={draft.secret}
                      disabled={saving || isArchived}
                      onChange={(e) => patch({ secret: e.target.checked })}
                      className="rounded border-input"
                    />
                    Produto secreto
                  </label>
                </div>
              </div>
            </AdminAdvancedSection>
          </div>
        </div>

        <SheetFooter className="mt-auto gap-2 border-t border-outline-variant/20 px-6 py-4">
          {draft.isDraft && onDiscardDraft ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onDiscardDraft}
            >
              Descartar rascunho
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            className="ml-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || isArchived}
            onClick={() => onSave(draft)}
          >
            {saving ? "Salvando…" : "Salvar produto"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
