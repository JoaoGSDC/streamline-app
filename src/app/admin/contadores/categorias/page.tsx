"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { services } from "@services";
import type { CounterCategoryDto } from "@server/counters/counters.types";

export default function CounterCategoriesPage() {
  const [categories, setCategories] = useState<CounterCategoryDto[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.counters.listCategories();
      setCategories(result.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await services.counters.createCategory({ name: name.trim() });
      setName("");
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categorias"
        description="Agrupe contadores por jogo, evento ou tema."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nova categoria</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Dark Souls, Pokémon, Metas"
                className="max-w-sm"
              />
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={saving || !name.trim()}
              >
                <Plus className="mr-2 size-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-body-sm text-muted-foreground">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">Nenhuma categoria criada.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{category.name}</p>
                <p className="text-caption text-muted-foreground">{category.slug}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
