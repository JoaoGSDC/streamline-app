"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { StoreRedemptionDto } from "@server/store/store.types";

export function useStoreRedemptions() {
  const { toast } = useToast();
  const [redemptions, setRedemptions] = useState<StoreRedemptionDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.listRedemptions({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setRedemptions(data.items);
      setTotal(data.total);
    } catch {
      toast({ title: "Erro ao carregar resgates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (
    id: string,
    status: StoreRedemptionDto["status"],
    notes?: string
  ) => {
    setSaving(true);
    try {
      await services.store.updateRedemption(id, { status, notes });
      toast({ title: "Resgate atualizado" });
      await load();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const refund = async (id: string, reason: string) => {
    setSaving(true);
    try {
      await services.store.refundRedemption(id, { reason });
      toast({ title: "Reembolso processado" });
      await load();
    } catch {
      toast({ title: "Erro ao reembolsar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    redemptions,
    total,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    saving,
    updateStatus,
    refund,
    exportUrl: services.store.exportRedemptionsCsv(),
    reload: load,
  };
}
