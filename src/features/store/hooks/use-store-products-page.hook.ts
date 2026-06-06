"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@services/index";
import type { StoreProductDto } from "@server/store/store.types";
import type { StoreProductRowState } from "@features/store/types/store-product.types";
import { createRandomString } from "@utils/factories/create-random-string";

const SEARCH_DEBOUNCE_MS = 300;

function dtoToRow(dto: StoreProductDto): StoreProductRowState {
  return {
    id: dto.id,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    name: dto.name,
    shortDescription: dto.shortDescription ?? "",
    fullDescription: dto.fullDescription ?? "",
    imageUrl: dto.imageUrl ?? "",
    productType: dto.productType,
    rarity: dto.rarity ?? "",
    pricePoints: dto.pricePoints,
    priceCoins: dto.priceCoins,
    priceMode: dto.priceMode,
    stockUnlimited: dto.stockUnlimited,
    stockQuantity: dto.stockQuantity ?? 0,
    fulfillmentMode: dto.fulfillmentMode,
    fulfillmentInstructions: dto.internalNotes ?? "",
    featured: dto.featured,
    status: dto.status,
    subscribersOnly: dto.subscribersOnly,
    vipOnly: dto.vipOnly,
    secret: dto.secret,
  };
}

function rowToPayload(row: StoreProductRowState) {
  return {
    categoryId: row.categoryId,
    name: row.name.trim(),
    shortDescription: row.shortDescription || null,
    fullDescription: row.fullDescription || null,
    imageUrl: row.imageUrl.trim() || null,
    productType: row.productType,
    rarity: row.rarity || null,
    pricePoints: row.pricePoints,
    priceCoins: row.priceCoins,
    priceMode: row.priceMode,
    stockUnlimited: row.stockUnlimited,
    stockQuantity: row.stockUnlimited ? null : row.stockQuantity,
    fulfillmentMode: row.fulfillmentMode,
    internalNotes: row.fulfillmentInstructions.trim() || null,
    featured: row.featured,
    status: row.status === "archived" ? "inactive" : row.status,
    subscribersOnly: row.subscribersOnly,
    vipOnly: row.vipOnly,
    secret: row.secret,
  };
}

export function useStoreProductsPage() {
  const [savedRows, setSavedRows] = useState<StoreProductRowState[]>([]);
  const [draftRows, setDraftRows] = useState<StoreProductRowState[]>([]);
  const [localEdits, setLocalEdits] = useState<
    Record<string, Partial<StoreProductRowState>>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.listProducts({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        limit: 100,
        includeArchived: statusFilter === "archived",
      });
      setSavedRows(data.items.map(dtoToRow));
      setLocalEdits({});
    } catch {
      setSavedRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const getRowState = useCallback(
    (row: StoreProductRowState): StoreProductRowState => ({
      ...row,
      ...localEdits[row.id],
    }),
    [localEdits]
  );

  const upsertSavedRow = useCallback((dto: StoreProductDto) => {
    const row = dtoToRow(dto);
    setSavedRows((prev) => {
      const index = prev.findIndex((item) => item.id === row.id);
      if (index === -1) return [...prev, row];
      const next = [...prev];
      next[index] = row;
      return next;
    });
  }, []);

  const persistRow = useCallback(
    async (row: StoreProductRowState) => {
      const merged: StoreProductRowState = {
        ...row,
        ...localEdits[row.id],
      };

      if (!merged.categoryId || !merged.name.trim()) {
        return false;
      }

      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        if (merged.isDraft || merged.isNew) {
          const created = await services.store.createProduct(rowToPayload(merged));
          setDraftRows((prev) => prev.filter((draft) => draft.id !== merged.id));
          upsertSavedRow(created);
          setLocalEdits((prev) => {
            const next = { ...prev };
            delete next[merged.id];
            return next;
          });
          return created;
        }

        const updated = await services.store.updateProduct(
          merged.id,
          rowToPayload(merged)
        );
        upsertSavedRow(updated);
        setLocalEdits((prev) => {
          const next = { ...prev };
          delete next[merged.id];
          return next;
        });
        return updated;
      } catch {
        return false;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [localEdits, upsertSavedRow]
  );

  const toggleActive = useCallback(
    async (row: StoreProductRowState, active: boolean) => {
      const status = active ? "active" : "inactive";

      if (row.isDraft || row.isNew) {
        setDraftRows((prev) =>
          prev.map((draft) =>
            draft.id === row.id ? { ...draft, status } : draft
          )
        );
        return;
      }

      setSavedRows((prev) =>
        prev.map((saved) =>
          saved.id === row.id ? { ...saved, status } : saved
        )
      );

      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        await services.store.updateProduct(row.id, { status });
      } catch {
        setSavedRows((prev) =>
          prev.map((saved) =>
            saved.id === row.id
              ? { ...saved, status: active ? "inactive" : "active" }
              : saved
          )
        );
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    []
  );

  const addDraftRow = useCallback((defaultCategoryId: string) => {
    const id = `draft-${createRandomString(8)}`;
    const draft: StoreProductRowState = {
      id,
      categoryId: defaultCategoryId,
      name: "",
      shortDescription: "",
      fullDescription: "",
      imageUrl: "",
      productType: "custom",
      rarity: "",
      pricePoints: 0,
      priceCoins: 0,
      priceMode: "points_only",
      stockUnlimited: true,
      stockQuantity: 10,
      fulfillmentMode: "manual",
      fulfillmentInstructions: "",
      featured: false,
      status: "inactive",
      subscribersOnly: false,
      vipOnly: false,
      secret: false,
      isDraft: true,
      isNew: true,
    };
    setDraftRows((prev) => [...prev, draft]);
    return draft;
  }, []);

  const removeDraftRow = useCallback((id: string) => {
    setDraftRows((prev) => prev.filter((row) => row.id !== id));
    setLocalEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const duplicateProduct = useCallback(
    async (row: StoreProductRowState): Promise<StoreProductRowState | null> => {
      if (row.isDraft) return null;
      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        const created = await services.store.duplicateProduct(row.id);
        const mapped = dtoToRow(created);
        upsertSavedRow(created);
        return mapped;
      } catch {
        return null;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [upsertSavedRow]
  );

  const archiveProduct = useCallback(
    async (row: StoreProductRowState) => {
      if (row.isDraft) return false;
      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        await services.store.updateProduct(row.id, { status: "archived" });
        setSavedRows((prev) => prev.filter((saved) => saved.id !== row.id));
        setLocalEdits((prev) => {
          const next = { ...prev };
          delete next[row.id];
          return next;
        });
        return true;
      } catch {
        return false;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    []
  );

  const productRows = useMemo(
    () => savedRows.map((row) => getRowState(row)),
    [savedRows, getRowState]
  );

  const draftRowsMerged = useMemo(
    () => draftRows.map((row) => getRowState(row)),
    [draftRows, getRowState]
  );

  const allRows = useMemo(
    () => [...productRows, ...draftRowsMerged],
    [productRows, draftRowsMerged]
  );

  return {
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    allRows,
    draftRows: draftRowsMerged,
    savingIds,
    addDraftRow,
    persistRow,
    toggleActive,
    removeDraftRow,
    duplicateProduct,
    archiveProduct,
    reload: load,
  };
}
