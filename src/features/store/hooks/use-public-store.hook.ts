"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type {
  StoreProductDto,
  StoreProductSort,
  StorePublicBalanceDto,
  StorePublicCatalogDto,
} from "@server/store/store.types";
import {
  canAffordProduct,
  sortStoreProducts,
} from "@server/store/store-product-utils";
import { createRandomString } from "@utils/factories/create-random-string";

export function usePublicStore(username: string) {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<StorePublicCatalogDto | null>(null);
  const [balance, setBalance] = useState<StorePublicBalanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<StoreProductSort>("default");

  const loadCatalog = useCallback(async () => {
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

  const loadBalance = useCallback(async () => {
    if (!username) return;
    setBalanceLoading(true);
    try {
      const data = await services.store.getPublicBalance(username);
      setBalance(data);
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadCatalog();
    void loadBalance();
  }, [loadCatalog, loadBalance]);

  const coinsAllowed = catalog?.config.coinsAllowed ?? false;

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
    return sortStoreProducts(list, sortBy);
  }, [allProducts, categoryId, search, sortBy]);

  const featuredProducts = useMemo(() => {
    const featured = catalog?.featuredProducts ?? [];
    return sortStoreProducts(featured, sortBy);
  }, [catalog?.featuredProducts, sortBy]);

  const userPoints = balance?.points ?? 0;
  const userCoins = balance?.coins ?? 0;

  const redeem = async (
    product: StoreProductDto,
    payWith?: "points" | "coins" | "combined"
  ) => {
    if (!balance?.authenticated) {
      toast({
        title: "Faça login para resgatar",
        description: "Conecte sua conta Twitch para usar seus pontos na loja.",
        variant: "destructive",
      });
      return;
    }

    if (
      !canAffordProduct(product, userPoints, userCoins, payWith)
    ) {
      toast({
        title: "Saldo insuficiente",
        description: coinsAllowed
          ? "Você precisa de mais pontos ou coins para este produto."
          : "Você precisa de mais pontos para este produto.",
        variant: "destructive",
      });
      return;
    }

    setRedeemingId(product.id);
    try {
      await services.store.redeemPublic(username, {
        productId: product.id,
        payWith,
        idempotencyKey: createRandomString(24),
      });
      toast({
        title: "Resgate realizado!",
        description: "Seu pedido foi registrado. Aguarde a entrega ou aprovação.",
      });
      await Promise.all([loadCatalog(), loadBalance()]);
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
    balance,
    loading,
    balanceLoading,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    sortBy,
    setSortBy,
    filteredProducts,
    featuredProducts,
    redeemingId,
    redeem,
    userPoints,
    userCoins,
    coinsAllowed,
    reload: async () => {
      await Promise.all([loadCatalog(), loadBalance()]);
    },
  };
}
