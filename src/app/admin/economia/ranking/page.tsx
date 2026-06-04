"use client";

import { Search, Trophy } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEconomyRankingPage } from "@features/economy/hooks/use-economy-ranking-page.hook";

function formatActivity(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    <div className="space-y-6">
      <AdminPageHeader
        title="Ranking"
        description="Top viewers do canal por pontos. Atualizado conforme o bot registra atividades."
      />

      <AdminSection>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome ou login…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-body-sm text-muted-foreground">
            {total} participante{total === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Trophy}
            title="Ranking vazio"
            description="Ainda não há viewers com pontos. Ative o sistema de pontos e integre o bot."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Última atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => (
                  <TableRow key={entry.twitchUserId}>
                    <TableCell className="font-mono text-muted-foreground">
                      {entry.position}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.displayName}</div>
                      <div className="text-body-xs text-muted-foreground">
                        @{entry.twitchUsername}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.points.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {entry.level}
                      {entry.levelTitle ? (
                        <span className="text-body-xs text-muted-foreground">
                          {" "}
                          · {entry.levelTitle}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatActivity(entry.lastActivityAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-body-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </AdminSection>
    </div>
  );
}
