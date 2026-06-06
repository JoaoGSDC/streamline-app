"use client";

import { useState } from "react";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStoreCategories } from "@features/store/hooks/use-store-categories.hook";

export default function StoreCategoriesPage() {
  const { categories, loading, saving, createCategory, toggleCategory, deleteCategory } =
    useStoreCategories();
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCategory(newName.trim());
    setNewName("");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categorias"
        description='A categoria "Geral" é criada automaticamente. Adicione categorias customizadas para organizar sua loja.'
      />

      <div className="flex gap-2">
        <Input
          placeholder="Nome da nova categoria"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
        />
        <Button onClick={() => void handleCreate()} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <AdminEmptyState
          icon={FolderOpen}
          title="Nenhuma categoria criada"
          description="Organize seus produtos em categorias para facilitar a navegação dos viewers."
        />
      ) : (
        <ul className="divide-y rounded-lg border border-outline-variant/30">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {category.name}
                  {category.isDefault && (
                    <span className="ml-2 text-body-xs text-muted-foreground">
                      (padrão)
                    </span>
                  )}
                </p>
                <p className="text-body-xs text-muted-foreground">
                  {category.productCount ?? 0} produto(s) · slug: {category.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={category.enabled}
                  disabled={saving || category.isDefault}
                  onCheckedChange={() => void toggleCategory(category)}
                  aria-label={`Ativar ${category.name}`}
                />
                {!category.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(category.id)}
                    aria-label="Remover categoria"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Produtos nesta categoria precisam ser movidos antes da remoção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) void deleteCategory(deleteId);
                setDeleteId(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
