"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@services/index";
import type { StoreProductDto } from "@server/store/store.types";
import type { StoreProductRowState } from "@features/store/components/StoreProductAccordionRow";
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
    productType: dto.productType,
    rarity: dto.rarity ?? "",
    pricePoints: dto.pricePoints,
    priceCoins: dto.priceCoins,
    priceMode: dto.priceMode,
    stockUnlimited: dto.stockUnlimited,
    stockQuantity: dto.stockQuantity ?? 0,
    fulfillmentMode: dto.fulfillmentMode,
    featured: dto.featured,
    status: dto.status,
  };
}

function rowToPayload(row: StoreProductRowState) {
  return {
    categoryId: row.categoryId,
    name: row.name.trim(),
    shortDescription: row.shortDescription || null,
    fullDescription: row.fullDescription || null,
    productType: row.productType,
    rarity: row.rarity || null,
    pricePoints: row.pricePoints,
    priceCoins: row.priceCoins,
    priceMode: row.priceMode,
    stockUnlimited: row.stockUnlimited,
    stockQuantity: row.stockUnlimited ? null : row.stockQuantity,
    fulfillmentMode: row.fulfillmentMode,
    featured: row.featured,
    status: row.status === "archived" ? "inactive" : row.status,
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
  const [openAccordion, setOpenAccordion] = useState<string[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

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
      setDirtyIds(new Set());
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

  const markDirty = useCallback((id: string) => {
    setDirtyIds((prev) => new Set(prev).add(id));
  }, []);

  const clearDirty = useCallback((id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const patchLocal = useCallback(
    (id: string, patch: Partial<StoreProductRowState>) => {
      setLocalEdits((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
      markDirty(id);
    },
    [markDirty]
  );

  const isRowDirty = useCallback(
    (id: string) => {
      const edits = localEdits[id];
      if (!edits && !dirtyIds.has(id)) return false;
      const keys = Object.keys(edits ?? {});
      if (keys.length === 0) return dirtyIds.has(id);
      const contentKeys = keys.filter((key) => key !== "status");
      return contentKeys.length > 0 || Boolean(dirtyIds.has(id) && keys.length > 0);
    },
    [dirtyIds, localEdits]
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
          setOpenAccordion((prev) =>
            prev.map((value) => (value === merged.id ? created.id : value))
          );
          setLocalEdits((prev) => {
            const next = { ...prev };
            delete next[merged.id];
            return next;
          });
          clearDirty(merged.id);
          return true;
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
        clearDirty(merged.id);
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
    [clearDirty, localEdits, upsertSavedRow]
  );

  const updateRow = useCallback(
    (id: string, patch: Partial<StoreProductRowState>) => {
      patchLocal(id, patch);
    },
    [patchLocal]
  );

  const toggleActive = useCallback(
    async (row: StoreProductRowState, active: boolean) => {
      const status = active ? "active" : "inactive";

      if (row.isDraft || row.isNew) {
        patchLocal(row.id, { status });
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
        setLocalEdits((prev) => {
          const current = prev[row.id];
          if (!current) return prev;
          const { status: _removed, ...rest } = current;
          if (Object.keys(rest).length === 0) {
            const next = { ...prev };
            delete next[row.id];
            clearDirty(row.id);
            return next;
          }
          return { ...prev, [row.id]: rest };
        });
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
    [clearDirty, patchLocal]
  );

  const addDraftRow = useCallback((defaultCategoryId: string) => {
    const id = `draft-${createRandomString(8)}`;
    const draft: StoreProductRowState = {
      id,
      categoryId: defaultCategoryId,
      name: "",
      shortDescription: "",
      fullDescription: "",
      productType: "custom",
      rarity: "",
      pricePoints: 0,
      priceCoins: 0,
      priceMode: "points_only",
      stockUnlimited: true,
      stockQuantity: 10,
      fulfillmentMode: "manual",
      featured: false,
      status: "inactive",
      isDraft: true,
      isNew: true,
    };
    setDraftRows((prev) => [...prev, draft]);
    setOpenAccordion((prev) => [...prev, id]);
  }, []);

  const removeDraftRow = useCallback(
    (id: string) => {
      setDraftRows((prev) => prev.filter((row) => row.id !== id));
      setLocalEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      clearDirty(id);
      setOpenAccordion((prev) => prev.filter((value) => value !== id));
    },
    [clearDirty]
  );

  const duplicateProduct = useCallback(
    async (row: StoreProductRowState) => {
      if (row.isDraft) return false;
      setSavingIds((prev) => new Set(prev).add(row.id));
      try {
        const created = await services.store.duplicateProduct(row.id);
        upsertSavedRow(created);
        setOpenAccordion((prev) => [...prev, created.id]);
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
        clearDirty(row.id);
        setOpenAccordion((prev) => prev.filter((value) => value !== row.id));
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
    [clearDirty]
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
    openAccordion,
    setOpenAccordion,
    allRows,
    draftRows: draftRowsMerged,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleActive,
    removeDraftRow,
    duplicateProduct,
    archiveProduct,
    isRowDirty,
    reload: load,
  };
}
