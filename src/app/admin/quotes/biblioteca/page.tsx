"use client";

import { useState } from "react";
import { Archive, MessageSquareQuote, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteFormDialog } from "@features/quotes/components/QuoteFormDialog";
import { useQuotesLibrary } from "@features/quotes/hooks/use-quotes-library.hook";
import { toast } from "sonner";

export default function QuotesLibraryPage() {
  const {
    quotes,
    categories,
    selected,
    setSelected,
    search,
    setSearch,
    loading,
    saving,
    total,
    createQuote,
    updateQuote,
    archiveQuote,
    deleteQuote,
  } = useQuotesLibrary();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Biblioteca de Quotes"
        description={`${total} quotes no canal`}
      >
        <Button
          onClick={() => {
            setEditing(false);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Nova quote
        </Button>
      </AdminPageHeader>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por texto, autor, jogo..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : quotes.length === 0 ? (
              <AdminEmptyState
                icon={MessageSquareQuote}
                title="Nenhuma quote ainda"
                description="Crie a primeira quote manualmente ou use !addquote no chat."
              />
            ) : (
              <div className="max-h-[70vh] divide-y overflow-y-auto">
                {quotes.map((quote) => (
                  <button
                    key={quote.id}
                    type="button"
                    className={`w-full px-4 py-3 text-left transition hover:bg-muted/40 ${
                      selected?.id === quote.id ? "bg-muted/60" : ""
                    }`}
                    onClick={() => setSelected(quote)}
                  >
                    <p className="text-caption text-muted-foreground">#{quote.number}</p>
                    <p className="text-body-sm line-clamp-2">{quote.text}</p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {quote.speakerName}
                      {quote.gameName ? ` · ${quote.gameName}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            {!selected ? (
              <p className="text-body-sm text-muted-foreground">
                Selecione uma quote para ver os detalhes.
              </p>
            ) : (
              <>
                <div>
                  <p className="text-caption text-muted-foreground">Quote #{selected.number}</p>
                  <p className="mt-2 text-body-md font-medium">&ldquo;{selected.text}&rdquo;</p>
                </div>

                <div className="grid gap-2 text-body-sm text-muted-foreground">
                  <p>Falou: {selected.speakerName}</p>
                  <p>Registrou: @{selected.registeredByUsername}</p>
                  <p>Fonte: {selected.source}</p>
                  {selected.gameName ? <p>Jogo: {selected.gameName}</p> : null}
                  {selected.streamTitle ? <p>Live: {selected.streamTitle}</p> : null}
                  {selected.categoryName ? <p>Categoria: {selected.categoryName}</p> : null}
                  {selected.tags.length > 0 ? (
                    <p>Tags: {selected.tags.map((tag) => `#${tag.slug}`).join(", ")}</p>
                  ) : null}
                  <p>Exibida {selected.displayCount}×</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(true);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() =>
                      void archiveQuote(selected.id).then(() =>
                        toast.success("Quote arquivada")
                      )
                    }
                  >
                    <Archive className="mr-2 size-4" />
                    Arquivar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={saving}
                    onClick={() =>
                      void deleteQuote(selected.id).then(() =>
                        toast.success("Quote excluída")
                      )
                    }
                  >
                    <Trash2 className="mr-2 size-4" />
                    Excluir
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <QuoteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        quote={editing ? selected : null}
        saving={saving}
        onSubmit={async (payload) => {
          if (editing && selected) {
            await updateQuote(selected.id, payload);
            toast.success("Quote atualizada");
            return;
          }
          await createQuote(payload);
          toast.success("Quote criada");
        }}
      />
    </div>
  );
}
