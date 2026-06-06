"use client";

import { Search, Trophy } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { EconomyPagination } from "@features/economy/components/EconomyPagination";
import { EconomyRankingTable } from "@features/economy/components/EconomyRankingTable";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEconomyRankingPage } from "@features/economy/hooks/use-economy-ranking-page.hook";

export default function EconomyRankingPage() {
  const {
    items,
    total,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    loading,
  } = useEconomyRankingPage();

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        title="Ranking"
        description="Top viewers do canal por pontos. Atualizado conforme o bot registra atividades."
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome ou login…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-caption">
            {total} participante{total === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Trophy}
            title="Ranking ainda vazio"
            description="Ative o sistema de pontos para que viewers acumulem saldo e disputem o topo do canal."
          />
        ) : (
          <>
            <EconomyRankingTable items={items} />
            <EconomyPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
