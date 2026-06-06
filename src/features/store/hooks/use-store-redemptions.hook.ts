"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type {
  StoreRedemptionDto,
  StoreRedemptionStatusCounts,
} from "@server/store/store.types";

const EMPTY_COUNTS: StoreRedemptionStatusCounts = {
  all: 0,
  pending: 0,
  approved: 0,
  delivered: 0,
  cancelled: 0,
  refunded: 0,
};

export function useStoreRedemptions() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [redemptions, setRedemptions] = useState<StoreRedemptionDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusCounts, setStatusCounts] =
    useState<StoreRedemptionStatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (
      statusFromUrl &&
      ["pending", "approved", "delivered", "cancelled", "refunded"].includes(
        statusFromUrl
      )
    ) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.listRedemptions({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setRedemptions(data.items);
      setTotal(data.total);
      setStatusCounts(data.statusCounts ?? EMPTY_COUNTS);
    } catch {
      toast({ title: "Erro ao carregar resgates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, statusFilter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

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
    totalPages,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusCounts,
    loading,
    saving,
    updateStatus,
    refund,
    exportUrl: services.store.exportRedemptionsCsv(),
    reload: load,
  };
}
