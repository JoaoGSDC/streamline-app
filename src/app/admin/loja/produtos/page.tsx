"use client";

import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
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
import {
  StoreProductAccordionRow,
  type StoreProductRowState,
} from "@features/store/components/StoreProductAccordionRow";

export default function StoreProductsPage() {
  const { toast } = useToast();
  const { categories } = useStoreCategories();
  const [archiveTarget, setArchiveTarget] = useState<StoreProductRowState | null>(
    null
  );

  const {
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    openAccordion,
    setOpenAccordion,
    allRows,
    draftRows,
    savingIds,
    addDraftRow,
    updateRow,
    persistRow,
    toggleActive,
    removeDraftRow,
    duplicateProduct,
    archiveProduct,
    isRowDirty,
  } = useStoreProductsPage();

  const defaultCategoryId =
    categories.find((c) => c.isDefault)?.id ?? categories[0]?.id ?? "";

  const handleAddProduct = () => {
    if (!defaultCategoryId) {
      toast({
        title: "Crie uma categoria primeiro",
        description: "A categoria Geral será criada automaticamente ao abrir Categorias.",
        variant: "destructive",
      });
      return;
    }
    addDraftRow(defaultCategoryId);
  };

  const handleSaveRow = async (row: StoreProductRowState) => {
    const ok = await persistRow(row);
    if (ok) {
      toast({
        title: row.isDraft ? "Produto criado" : "Produto salvo",
        description: "As alterações foram aplicadas.",
      });
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
    } else {
      toast({
        title: "Erro ao arquivar",
        variant: "destructive",
      });
    }
  };

  const renderRow = (row: StoreProductRowState) => (
    <StoreProductAccordionRow
      key={row.id}
      product={row}
      categories={categories}
      saving={savingIds.has(row.id)}
      hasUnsavedChanges={
        (isRowDirty(row.id) || Boolean(row.isDraft)) && !savingIds.has(row.id)
      }
      onChange={(patch) => updateRow(row.id, patch)}
      onSave={() => void handleSaveRow(row)}
      onToggleActive={(active) => void toggleActive(row, active)}
      onDuplicate={
        row.isDraft
          ? undefined
          : () =>
              void duplicateProduct(row).then((ok) => {
                if (ok) toast({ title: "Produto duplicado" });
                else toast({ title: "Erro ao duplicar", variant: "destructive" });
              })
      }
      onArchive={
        row.isDraft ? undefined : () => setArchiveTarget(row)
      }
      onRemoveDraft={row.isDraft ? () => removeDraftRow(row.id) : undefined}
    />
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Produtos"
        description="Cadastre recompensas inline — expanda cada linha, edite e clique em Salvar produto."
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
          title="Nenhum produto"
          description='Clique em "Novo produto" para abrir uma linha em rascunho e preencher os campos.'
          action={
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Criar produto
            </Button>
          }
        />
      ) : (
        <Accordion
          type="multiple"
          value={openAccordion}
          onValueChange={setOpenAccordion}
          className="space-y-2"
        >
          {allRows.map(renderRow)}
        </Accordion>
      )}

      {!loading && allRows.length > 0 && draftRows.length > 0 && (
        <p className="text-body-sm text-muted-foreground">
          {draftRows.length} rascunho(s) — salve ou descarte antes de sair da página.
        </p>
      )}

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{archiveTarget?.name}</strong> será ocultado da loja ativa. Você
              pode filtrar por arquivados para revisá-lo depois.
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
