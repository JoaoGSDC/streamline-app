"use client";

import { useState } from "react";
import { ClipboardList, Download, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStoreRedemptions } from "@features/store/hooks/use-store-redemptions.hook";
import type { StoreRedemptionDto } from "@server/store/store.types";

const statusLabels: Record<StoreRedemptionDto["status"], string> = {
  pending: "Pendente",
  approved: "Aprovado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
};

export default function StoreRedemptionsPage() {
  const {
    redemptions,
    loading,
    saving,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    updateStatus,
    refund,
    exportUrl,
  } = useStoreRedemptions();

  const [refundTarget, setRefundTarget] = useState<StoreRedemptionDto | null>(null);
  const [refundReason, setRefundReason] = useState("");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Resgates"
        description="Aprove, entregue ou reembolse resgates dos viewers."
      >
        <Button variant="outline" size="sm" asChild>
          <a href={exportUrl} download="resgates.csv">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </a>
        </Button>
      </AdminPageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por usuário ou produto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
            <SelectItem value="refunded">Reembolsados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : redemptions.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardList}
          title="Nenhum resgate"
          description="Quando viewers resgatarem produtos, os pedidos aparecerão aqui."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
          <table className="w-full min-w-[640px] text-left text-body-sm">
            <thead className="border-b bg-surface-container-low/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {redemptions.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.displayName}</p>
                    <p className="text-body-xs text-muted-foreground">
                      @{row.twitchUsername}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.productName}</td>
                  <td className="px-4 py-3">
                    {row.paidPoints > 0 && `${row.paidPoints} pts`}
                    {row.paidPoints > 0 && row.paidCoins > 0 && " + "}
                    {row.paidCoins > 0 && `${row.paidCoins} coins`}
                  </td>
                  <td className="px-4 py-3">{statusLabels[row.status]}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() =>
                              void updateStatus(row.id, "approved")
                            }
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() =>
                              void updateStatus(row.id, "cancelled")
                            }
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {row.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() =>
                            void updateStatus(row.id, "delivered")
                          }
                        >
                          Entregar
                        </Button>
                      )}
                      {!["refunded", "cancelled"].includes(row.status) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          onClick={() => setRefundTarget(row)}
                        >
                          Reembolsar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog
        open={!!refundTarget}
        onOpenChange={() => setRefundTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reembolsar resgate?</AlertDialogTitle>
            <AlertDialogDescription>
              Os pontos e coins serão devolvidos ao usuário. Estoque será
              restaurado se aplicável.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo do reembolso (obrigatório)"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRefundReason("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={refundReason.trim().length < 3}
              onClick={() => {
                if (refundTarget) {
                  void refund(refundTarget.id, refundReason.trim());
                  setRefundTarget(null);
                  setRefundReason("");
                }
              }}
            >
              Confirmar reembolso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
