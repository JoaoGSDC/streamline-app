"use client";

import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { StorePriceLabel } from "@features/store/components/StorePriceLabel";
import type { StoreRedemptionDto } from "@server/store/store.types";

const STATUS_VARIANT: Record<
  StoreRedemptionDto["status"],
  "default" | "secondary" | "destructive" | "outline" | "active" | "inactive" | "featured" | "draft"
> = {
  pending: "featured",
  approved: "active",
  delivered: "active",
  cancelled: "inactive",
  expired: "inactive",
  refunded: "secondary",
};

const STATUS_LABELS: Record<StoreRedemptionDto["status"], string> = {
  pending: "Pendente",
  approved: "Aprovado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
};

type StatusAction = {
  label: string;
  action: "approve" | "cancel" | "deliver" | "refund";
  variant?: "default" | "destructive";
};

function getStatusActions(status: StoreRedemptionDto["status"]): StatusAction[] {
  switch (status) {
    case "pending":
      return [
        { label: "Aprovar", action: "approve" },
        { label: "Cancelar", action: "cancel", variant: "destructive" },
      ];
    case "approved":
      return [
        { label: "Marcar entregue", action: "deliver" },
        { label: "Reembolsar", action: "refund", variant: "destructive" },
      ];
    case "delivered":
      return [{ label: "Reembolsar", action: "refund", variant: "destructive" }];
    default:
      return [];
  }
}

interface StoreRedemptionsTableProps {
  rows: StoreRedemptionDto[];
  saving?: boolean;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onDeliver: (id: string) => void;
  onRefund: (row: StoreRedemptionDto) => void;
}

export function StoreRedemptionsTable({
  rows,
  saving = false,
  onApprove,
  onCancel,
  onDeliver,
  onRefund,
}: StoreRedemptionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="economy-users-table w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="px-3 py-2 font-medium" scope="col">
              Produto
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Viewer
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Custo
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Data
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Status
            </th>
            <th className="w-16 px-3 py-2 text-right font-medium" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const actions = getStatusActions(row.status);

            return (
              <tr
                key={row.id}
                className={cn(
                  "h-11 border-b border-outline-variant/10 last:border-b-0",
                  index % 2 === 1 && "bg-muted/20"
                )}
              >
                <td className="px-3 py-0 align-middle font-medium">
                  {row.productName}
                </td>
                <td className="px-3 py-0 align-middle">
                  <div>{row.displayName}</div>
                  <div className="text-caption">@{row.twitchUsername}</div>
                </td>
                <td className="px-3 py-0 align-middle">
                  <StorePriceLabel
                    product={{
                      pricePoints: row.paidPoints,
                      priceCoins: row.paidCoins,
                      priceMode:
                        row.paidPoints > 0 && row.paidCoins > 0
                          ? "combined"
                          : row.paidCoins > 0
                            ? "coins_only"
                            : "points_only",
                    }}
                  />
                </td>
                <td className="px-3 py-0 align-middle text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-0 align-middle">
                  <Badge variant={STATUS_VARIANT[row.status]}>
                    {STATUS_LABELS[row.status]}
                  </Badge>
                </td>
                <td className="px-3 py-0 align-middle text-right">
                  {actions.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={saving}
                          aria-label="Ações do resgate"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((item) => (
                          <DropdownMenuItem
                            key={item.action}
                            className={
                              item.variant === "destructive"
                                ? "text-destructive focus:text-destructive"
                                : undefined
                            }
                            onClick={() => {
                              if (item.action === "approve") onApprove(row.id);
                              if (item.action === "cancel") onCancel(row.id);
                              if (item.action === "deliver") onDeliver(row.id);
                              if (item.action === "refund") onRefund(row);
                            }}
                          >
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-caption text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
