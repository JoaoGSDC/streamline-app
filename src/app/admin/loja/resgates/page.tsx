"use client";

import { Suspense, useState } from "react";
import { ClipboardList, Download, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { EconomyPagination } from "@features/economy/components/EconomyPagination";
import { StoreRedemptionsTable } from "@features/store/components/StoreRedemptionsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStoreRedemptions } from "@features/store/hooks/use-store-redemptions.hook";
import type { StoreRedemptionDto } from "@server/store/store.types";

const STATUS_FILTERS = [
  { key: "", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
  { key: "delivered", label: "Entregues" },
  { key: "cancelled", label: "Cancelados" },
] as const;

function StoreRedemptionsPageContent() {
  const {
    redemptions,
    page,
    setPage,
    totalPages,
    loading,
    saving,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusCounts,
    updateStatus,
    refund,
    exportUrl,
  } = useStoreRedemptions();

  const [refundTarget, setRefundTarget] = useState<StoreRedemptionDto | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const getCount = (key: string) => {
    if (!key) return statusCounts.all;
    return statusCounts[key as keyof typeof statusCounts] ?? 0;
  };

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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por usuário ou produto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.key;
          const count = getCount(filter.key);
          return (
            <button
              key={filter.key || "all"}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-label transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/30 text-muted-foreground hover:bg-muted/40"
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-caption",
                  active ? "bg-primary/15" : "bg-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : redemptions.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardList}
          title="Nenhum resgate ainda"
          description="Os resgates aparecerão aqui quando viewers resgatarem produtos da sua loja."
        />
      ) : (
        <>
          <StoreRedemptionsTable
            rows={redemptions}
            saving={saving}
            onApprove={(id) => void updateStatus(id, "approved")}
            onCancel={(id) => void updateStatus(id, "cancelled")}
            onDeliver={(id) => void updateStatus(id, "delivered")}
            onRefund={(row) => setRefundTarget(row)}
          />
          <EconomyPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRefundTarget(null);
            setRefundReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reembolsar resgate</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Motivo do reembolso</Label>
            <Textarea
              id="refund-reason"
              rows={3}
              placeholder="Descreva o motivo do reembolso…"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRefundTarget(null);
                setRefundReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={refundReason.trim().length < 3 || saving}
              onClick={() => {
                if (!refundTarget) return;
                void refund(refundTarget.id, refundReason.trim()).then(() => {
                  setRefundTarget(null);
                  setRefundReason("");
                });
              }}
            >
              Confirmar reembolso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StoreRedemptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      }
    >
      <StoreRedemptionsPageContent />
    </Suspense>
  );
}
