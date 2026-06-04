"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type {
  StoreProductDto,
  StorePublicCatalogDto,
} from "@server/store/store.types";
import { createRandomString } from "@utils/factories/create-random-string";

export function usePublicStore(username: string) {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<StorePublicCatalogDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const data = await services.store.getPublicCatalog(username);
      setCatalog(data);
    } catch {
      setCatalog(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const allProducts = useMemo(() => {
    if (!catalog) return [];
    return catalog.products ?? [];
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (categoryId !== "all") {
      list = list.filter((p) => p.categoryId === categoryId);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allProducts, categoryId, search]);

  const redeem = async (productId: string, payWith?: "points" | "coins" | "combined") => {
    setRedeemingId(productId);
    try {
      await services.store.redeemPublic(username, {
        productId,
        payWith,
        idempotencyKey: createRandomString(24),
      });
      toast({
        title: "Resgate realizado!",
        description: "Seu pedido foi registrado. Aguarde a entrega ou aprovação.",
      });
      await load();
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
          ? String((error.response.data as { error: string }).error)
          : "Não foi possível completar o resgate.";
      toast({ title: "Erro no resgate", description: message, variant: "destructive" });
    } finally {
      setRedeemingId(null);
    }
  };

  return {
    catalog,
    loading,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    filteredProducts,
    featuredProducts: catalog?.featuredProducts ?? [],
    redeemingId,
    redeem,
    reload: load,
  };
}
