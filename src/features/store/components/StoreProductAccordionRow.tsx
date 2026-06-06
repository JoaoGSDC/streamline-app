"use client";

import { AlertCircle, Archive, Copy, Trash2 } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminAdvancedSection } from "@/components/admin/shared/AdminAdvancedSection";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StorePriceLabel } from "@features/store/components/StorePriceLabel";
import { StoreRarityBadge } from "@features/store/components/StoreRarityBadge";
import type {
  StoreCategoryDto,
  StoreFulfillmentMode,
  StorePriceMode,
  StoreProductRarity,
  StoreProductStatus,
  StoreProductType,
} from "@server/store/store.types";
import {
  STORE_PRODUCT_TYPE_LABELS,
  STORE_RARITY_LABELS,
} from "@server/store/store.types";

export interface StoreProductRowState {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  productType: StoreProductType;
  rarity: StoreProductRarity | "" | null;
  pricePoints: number;
  priceCoins: number;
  priceMode: StorePriceMode;
  stockUnlimited: boolean;
  stockQuantity: number;
  fulfillmentMode: StoreFulfillmentMode;
  featured: boolean;
  status: StoreProductStatus;
  isDraft?: boolean;
  isNew?: boolean;
}

interface StoreProductAccordionRowProps {
  product: StoreProductRowState;
  categories: StoreCategoryDto[];
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  onChange: (patch: Partial<StoreProductRowState>) => void;
  onSave: () => void;
  onToggleActive: (active: boolean) => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRemoveDraft?: () => void;
}

export function StoreProductAccordionRow({
  product,
  categories,
  saving = false,
  hasUnsavedChanges = false,
  onChange,
  onSave,
  onToggleActive,
  onDuplicate,
  onArchive,
  onRemoveDraft,
}: StoreProductAccordionRowProps) {
  const isArchived = product.status === "archived";
  const isInactive = product.status !== "active" && !isArchived;
  const previewText = product.shortDescription.trim() || product.fullDescription.trim();

  const statusBadge = product.isDraft ? (
    <Badge variant="draft">Rascunho</Badge>
  ) : isArchived ? (
    <Badge variant="inactive">Arquivado</Badge>
  ) : isInactive ? (
    <Badge variant="inactive">Inativo</Badge>
  ) : product.featured ? (
    <Badge variant="featured">Destaque</Badge>
  ) : null;

  return (
    <AccordionItem
      value={product.id}
      className="overflow-hidden rounded-lg border border-outline-variant/30 px-3"
    >
      <div className="flex min-w-0 items-center gap-2 py-1">
        <AccordionTrigger className="min-w-0 flex-1 gap-2 overflow-hidden py-3 hover:no-underline">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate font-medium">
                {product.name.trim() || "Novo produto"}
              </span>
              <span className="text-caption">
                {STORE_PRODUCT_TYPE_LABELS[product.productType]}
              </span>
              <StoreRarityBadge rarity={product.rarity || null} />
              {statusBadge}
              {hasUnsavedChanges && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex shrink-0 text-amber-500"
                      role="img"
                      aria-label="Não salvo"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Alterações não salvas</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              {previewText ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-body-sm text-muted-foreground">
                      {previewText}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm break-words">
                    {previewText}
                  </TooltipContent>
                </Tooltip>
              ) : null}
              <StorePriceLabel
                product={{
                  pricePoints: product.pricePoints,
                  priceCoins: product.priceCoins,
                  priceMode: product.priceMode,
                }}
              />
            </div>
          </div>
        </AccordionTrigger>
        <Switch
          checked={product.status === "active"}
          disabled={saving || isArchived}
          onCheckedChange={onToggleActive}
          aria-label={`Ativar ${product.name}`}
          className="shrink-0"
        />
      </div>

      <AccordionContent className="space-y-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor={`name-${product.id}`}>Nome</Label>
          <Input
            id={`name-${product.id}`}
            value={product.name}
            disabled={saving || isArchived}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={product.categoryId}
            disabled={saving || isArchived}
            onValueChange={(v) => onChange({ categoryId: v })}
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
          <Label htmlFor={`short-${product.id}`}>Descrição curta</Label>
          <Input
            id={`short-${product.id}`}
            value={product.shortDescription}
            disabled={saving || isArchived}
            onChange={(e) => onChange({ shortDescription: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Modo de preço</Label>
          <Select
            value={product.priceMode}
            disabled={saving || isArchived}
            onValueChange={(v) => onChange({ priceMode: v as StorePriceMode })}
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
            <Label htmlFor={`points-${product.id}`}>Preço (Points)</Label>
            <Input
              id={`points-${product.id}`}
              type="number"
              min={0}
              value={product.pricePoints}
              disabled={saving || isArchived}
              onChange={(e) =>
                onChange({
                  pricePoints: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`coins-${product.id}`}>Preço (Coins)</Label>
            <Input
              id={`coins-${product.id}`}
              type="number"
              min={0}
              value={product.priceCoins}
              disabled={saving || isArchived}
              onChange={(e) =>
                onChange({
                  priceCoins: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
        </div>

        <AdminAdvancedSection summary="Opções avançadas">
          <div className="admin-subsection-stack">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={product.productType}
                  disabled={saving || isArchived}
                  onValueChange={(v) =>
                    onChange({ productType: v as StoreProductType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STORE_PRODUCT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Raridade</Label>
                <Select
                  value={product.rarity || "none"}
                  disabled={saving || isArchived}
                  onValueChange={(v) =>
                    onChange({ rarity: v === "none" ? "" : (v as StoreProductRarity) })
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

            <div className="space-y-2">
              <Label htmlFor={`full-${product.id}`}>Descrição completa</Label>
              <Textarea
                id={`full-${product.id}`}
                rows={3}
                value={product.fullDescription}
                disabled={saving || isArchived}
                onChange={(e) => onChange({ fullDescription: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <p className="text-label font-medium">Estoque ilimitado</p>
              <Switch
                checked={product.stockUnlimited}
                disabled={saving || isArchived}
                onCheckedChange={(v) => onChange({ stockUnlimited: v })}
              />
            </div>

            {!product.stockUnlimited && (
              <div className="space-y-2">
                <Label htmlFor={`stock-${product.id}`}>Quantidade</Label>
                <Input
                  id={`stock-${product.id}`}
                  type="number"
                  min={0}
                  value={product.stockQuantity}
                  disabled={saving || isArchived}
                  onChange={(e) =>
                    onChange({
                      stockQuantity: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Entrega</Label>
              <Select
                value={product.fulfillmentMode}
                disabled={saving || isArchived}
                onValueChange={(v) =>
                  onChange({ fulfillmentMode: v as StoreFulfillmentMode })
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

            <div className="flex items-center gap-2">
              <Switch
                checked={product.featured}
                disabled={saving || isArchived}
                onCheckedChange={(v) => onChange({ featured: v })}
              />
              <Label>Destaque</Label>
            </div>
          </div>
        </AdminAdvancedSection>

        <div className="flex flex-wrap gap-2 pt-2">
          {!isArchived && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? "Salvando…" : "Salvar produto"}
            </Button>
          )}
          {product.isDraft && onRemoveDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRemoveDraft}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Descartar rascunho
            </Button>
          )}
          {!product.isDraft && !isArchived && onDuplicate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDuplicate}
              disabled={saving}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
          )}
          {!product.isDraft && !isArchived && onArchive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onArchive}
              disabled={saving}
            >
              <Archive className="mr-2 h-4 w-4" />
              Arquivar
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
