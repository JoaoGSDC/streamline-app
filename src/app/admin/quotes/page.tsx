"use client";

import Link from "next/link";
import { MessageSquareQuote, Star, TrendingUp, Hash } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuotesDashboard } from "@features/quotes/hooks/use-quotes-dashboard.hook";

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-body-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : (
          <p className="font-headline text-headline-md font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuotesDashboardPage() {
  const { dashboard, loading } = useQuotesDashboard();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quotes"
        description="Memória histórica do canal — frases com contexto completo."
      >
        <Button asChild>
          <Link href="/admin/quotes/biblioteca">Abrir biblioteca</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de quotes" value={String(dashboard?.totalQuotes ?? 0)} loading={loading} />
        <StatCard title="Esta semana" value={String(dashboard?.quotesThisWeek ?? 0)} loading={loading} />
        <StatCard title="Exibições" value={String(dashboard?.totalDisplays ?? 0)} loading={loading} />
        <StatCard title="Icônicas" value={String(dashboard?.iconicCount ?? 0)} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <Hash className="size-4" />
              Categorias populares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (dashboard?.topCategories ?? []).length === 0 ? (
              <p className="text-body-sm text-muted-foreground">Nenhuma categoria ainda.</p>
            ) : (
              dashboard?.topCategories.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-body-sm">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <TrendingUp className="size-4" />
              Jogos com mais quotes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (dashboard?.topGames ?? []).length === 0 ? (
              <p className="text-body-sm text-muted-foreground">Nenhum jogo registrado ainda.</p>
            ) : (
              dashboard?.topGames.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-body-sm">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <MessageSquareQuote className="size-4" />
              Mais exibidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard?.mostDisplayed ?? []).map((item) => (
              <div key={item.number} className="rounded-md border px-3 py-2">
                <p className="text-caption text-muted-foreground">
                  #{item.number} · {item.displayCount}×
                </p>
                <p className="text-body-sm line-clamp-2">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <Star className="size-4" />
              Atividade recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard?.recentActivity ?? []).map((item) => (
              <div key={`${item.quoteId}-${item.occurredAt}`} className="text-body-sm">
                <span className="font-medium">#{item.number}</span>{" "}
                {item.action} por @{item.actorUsername}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
