"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { StoreCategoryDto } from "@server/store/store.types";

export function useStoreCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<StoreCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.store.listCategories();
      setCategories(data.items);
    } catch {
      toast({
        title: "Erro ao carregar categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const createCategory = async (name: string) => {
    setSaving(true);
    try {
      await services.store.createCategory({ name });
      toast({ title: "Categoria criada" });
      await load();
    } catch {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (category: StoreCategoryDto) => {
    setSaving(true);
    try {
      await services.store.updateCategory(category.id, {
        enabled: !category.enabled,
      });
      await load();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setSaving(true);
    try {
      await services.store.deleteCategory(id);
      toast({ title: "Categoria removida" });
      await load();
    } catch {
      toast({ title: "Não foi possível remover", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    categories,
    loading,
    saving,
    createCategory,
    toggleCategory,
    deleteCategory,
    reload: load,
  };
}
