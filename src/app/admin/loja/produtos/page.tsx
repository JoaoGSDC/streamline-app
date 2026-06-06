"use client";

import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { StoreProductEditDrawer } from "@features/store/components/StoreProductEditDrawer";
import { StoreProductsTable } from "@features/store/components/StoreProductsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useStoreProductsPage } from "@features/store/hooks/use-store-products-page.hook";
import { useStoreCategories } from "@features/store/hooks/use-store-categories.hook";
import type { StoreProductRowState } from "@features/store/types/store-product.types";

export default function StoreProductsPage() {
  const { toast } = useToast();
  const { categories } = useStoreCategories();
  const [editProduct, setEditProduct] = useState<StoreProductRowState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<StoreProductRowState | null>(
    null
  );

  const {
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    allRows,
    savingIds,
    addDraftRow,
    persistRow,
    toggleActive,
    removeDraftRow,
    duplicateProduct,
    archiveProduct,
  } = useStoreProductsPage();

  const defaultCategoryId =
    categories.find((c) => c.isDefault)?.id ?? categories[0]?.id ?? "";

  const openEdit = (row: StoreProductRowState) => {
    setEditProduct(row);
    setDrawerOpen(true);
  };

  const handleAddProduct = () => {
    if (!defaultCategoryId) {
      toast({
        title: "Crie uma categoria primeiro",
        description: "A categoria Geral será criada automaticamente ao abrir Categorias.",
        variant: "destructive",
      });
      return;
    }
    const draft = addDraftRow(defaultCategoryId);
    openEdit(draft);
  };

  const handleSave = async (product: StoreProductRowState) => {
    const result = await persistRow(product);
    if (result) {
      toast({
        title: product.isDraft ? "Produto criado" : "Produto salvo",
        description: "As alterações foram aplicadas.",
      });
      setDrawerOpen(false);
      setEditProduct(null);
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Verifique nome e categoria e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    const ok = await archiveProduct(archiveTarget);
    if (ok) {
      toast({ title: "Produto arquivado" });
      setArchiveTarget(null);
      if (editProduct?.id === archiveTarget.id) {
        setDrawerOpen(false);
        setEditProduct(null);
      }
    } else {
      toast({ title: "Erro ao arquivar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Produtos"
        description="Gerencie recompensas resgatáveis com tabela compacta e edição em drawer."
      >
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Novo produto
        </Button>
      </AdminPageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar produtos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : allRows.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="Sua loja ainda não tem produtos"
          description="Crie itens resgatáveis para engajar viewers e recompensar quem participa da live."
          action={
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro produto
            </Button>
          }
        />
      ) : (
        <StoreProductsTable
          rows={allRows}
          savingIds={savingIds}
          onEdit={openEdit}
          onToggleActive={(row, active) => void toggleActive(row, active)}
          onDuplicate={(row) =>
            void duplicateProduct(row).then((created) => {
              if (created) {
                toast({ title: "Produto duplicado" });
                openEdit(created);
              } else {
                toast({ title: "Erro ao duplicar", variant: "destructive" });
              }
            })
          }
          onArchive={(row) => setArchiveTarget(row)}
        />
      )}

      <StoreProductEditDrawer
        open={drawerOpen}
        product={editProduct}
        categories={categories}
        saving={editProduct ? savingIds.has(editProduct.id) : false}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditProduct(null);
        }}
        onSave={(product) => void handleSave(product)}
        onDiscardDraft={
          editProduct?.isDraft
            ? () => {
                removeDraftRow(editProduct.id);
                setDrawerOpen(false);
                setEditProduct(null);
              }
            : undefined
        }
      />

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{archiveTarget?.name}</strong> será ocultado da loja ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmArchive()}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
