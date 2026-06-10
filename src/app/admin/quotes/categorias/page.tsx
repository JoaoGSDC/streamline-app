"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { services } from "@services";
import type { QuoteCategoryDto } from "@server/quotes/quotes.types";
import { toast } from "sonner";

export default function QuotesCategoriesPage() {
  const [categories, setCategories] = useState<QuoteCategoryDto[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.quotes.listCategories();
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
      await services.quotes.createCategory({ name: name.trim() });
      setName("");
      await reload();
      toast.success("Categoria criada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categorias"
        description="Organize quotes por tipo: rage, engraçadas, promessas..."
      />

      <div className="flex max-w-xl gap-2">
        <Input
          placeholder="Nome da categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button onClick={() => void handleCreate()} disabled={saving || !name.trim()}>
          <Plus className="mr-2 size-4" />
          Criar
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {loading ? (
            <p className="p-4 text-body-sm text-muted-foreground">Carregando...</p>
          ) : categories.length === 0 ? (
            <p className="p-4 text-body-sm text-muted-foreground">Nenhuma categoria criada.</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-caption text-muted-foreground">/{category.slug}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
