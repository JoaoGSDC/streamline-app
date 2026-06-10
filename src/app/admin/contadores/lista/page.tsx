"use client";

import { useState } from "react";
import { Copy, Archive, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CounterCard } from "@features/counters/components/CounterCard";
import { CounterFormDialog } from "@features/counters/components/CounterFormDialog";
import { useCountersList } from "@features/counters/hooks/use-counters-list.hook";

export default function CountersListPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const {
    counters,
    categories,
    search,
    setSearch,
    loading,
    saving,
    createCounter,
    adjustCounter,
    archiveCounter,
    duplicateCounter,
  } = useCountersList();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Meus Contadores"
        description="Crie, ajuste e organize métricas da sua live."
      >
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Novo contador
        </Button>
      </AdminPageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar contadores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-body-sm text-muted-foreground">Carregando...</p>
      ) : counters.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          Nenhum contador encontrado. Crie o primeiro!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {counters.map((counter) => (
            <div key={counter.id} className="space-y-2">
              <CounterCard
                counter={counter}
                disabled={saving}
                onIncrement={() => void adjustCounter(counter.id, "increment")}
                onDecrement={() => void adjustCounter(counter.id, "decrement")}
                onReset={() => void adjustCounter(counter.id, "reset")}
              />
              <div className="flex gap-2 px-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void duplicateCounter(counter.id)}
                  disabled={saving}
                >
                  <Copy className="mr-1 size-3" />
                  Duplicar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void archiveCounter(counter.id)}
                  disabled={saving}
                >
                  <Archive className="mr-1 size-3" />
                  Arquivar
                </Button>
              </div>
              <p className="px-1 text-caption text-muted-foreground">
                Variável no chat:{" "}
                <code className="rounded bg-muted px-1">{`{count:${counter.slug}}`}</code>
              </p>
            </div>
          ))}
        </div>
      )}

      <CounterFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        saving={saving}
        onSubmit={async (payload) => {
          await createCounter(payload);
        }}
      />
    </div>
  );
}
