"use client";

import { Archive, Copy, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { StorePriceLabel } from "@features/store/components/StorePriceLabel";
import {
  STORE_PRODUCT_TYPE_LABELS,
  STORE_RARITY_LABELS,
} from "@server/store/store.types";
import type { StoreProductRowState } from "@features/store/types/store-product.types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&q=80";

interface StoreProductsTableProps {
  rows: StoreProductRowState[];
  savingIds: Set<string>;
  onEdit: (row: StoreProductRowState) => void;
  onToggleActive: (row: StoreProductRowState, active: boolean) => void;
  onDuplicate: (row: StoreProductRowState) => void;
  onArchive: (row: StoreProductRowState) => void;
}

export function StoreProductsTable({
  rows,
  savingIds,
  onEdit,
  onToggleActive,
  onDuplicate,
  onArchive,
}: StoreProductsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="economy-users-table w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="w-14 px-3 py-2 font-medium" scope="col">
              Imagem
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Nome
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Categoria
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Preço
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Estoque
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Status
            </th>
            <th className="w-32 px-3 py-2 text-right font-medium" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const saving = savingIds.has(row.id);
            const isArchived = row.status === "archived";
            const rarityLabel = row.rarity
              ? STORE_RARITY_LABELS[row.rarity]
              : null;

            return (
              <tr
                key={row.id}
                className={cn(
                  "group h-14 border-b border-outline-variant/10 last:border-b-0",
                  index % 2 === 1 && "bg-muted/20"
                )}
              >
                <td className="px-3 py-0 align-middle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.imageUrl || FALLBACK_IMAGE}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                  />
                </td>
                <td className="px-3 py-0 align-middle">
                  <p className="text-[14px] font-medium leading-tight">
                    {row.name.trim() || "Novo produto"}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {STORE_PRODUCT_TYPE_LABELS[row.productType]}
                    {rarityLabel ? ` · ${rarityLabel}` : ""}
                  </p>
                </td>
                <td className="px-3 py-0 align-middle text-label">
                  {row.categoryName ?? "—"}
                </td>
                <td className="px-3 py-0 align-middle">
                  <StorePriceLabel product={row} />
                </td>
                <td className="px-3 py-0 align-middle text-label">
                  {row.stockUnlimited ? (
                    <span className="text-muted-foreground">Ilimitado</span>
                  ) : (
                    row.stockQuantity
                  )}
                </td>
                <td className="px-3 py-0 align-middle">
                  <div className="flex flex-wrap items-center gap-2">
                    <Switch
                      checked={row.status === "active"}
                      disabled={saving || isArchived || row.isDraft}
                      onCheckedChange={(active) => onToggleActive(row, active)}
                      aria-label={`Ativar ${row.name}`}
                    />
                    {row.isDraft ? (
                      <Badge variant="draft">Rascunho</Badge>
                    ) : isArchived ? (
                      <Badge variant="inactive">Arquivado</Badge>
                    ) : row.status !== "active" ? (
                      <Badge variant="inactive">Inativo</Badge>
                    ) : null}
                    {row.featured && row.status === "active" && (
                      <Badge variant="featured">Destaque</Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-0 align-middle text-right">
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={saving}
                      onClick={() => onEdit(row)}
                      aria-label={`Editar ${row.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!row.isDraft && !isArchived && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={saving}
                          onClick={() => onDuplicate(row)}
                          aria-label={`Duplicar ${row.name}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={saving}
                          onClick={() => onArchive(row)}
                          aria-label={`Arquivar ${row.name}`}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
