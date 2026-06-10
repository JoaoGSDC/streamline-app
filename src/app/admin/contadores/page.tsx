"use client";

import Link from "next/link";
import { Hash, Target, TrendingUp, Activity } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCountersDashboard } from "@features/counters/hooks/use-counters-dashboard.hook";
import { CounterCard } from "@features/counters/components/CounterCard";
import { useCountersList } from "@features/counters/hooks/use-counters-list.hook";

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
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="font-headline text-headline-md font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function CountersDashboardPage() {
  const { dashboard, loading } = useCountersDashboard();
  const {
    counters,
    loading: countersLoading,
    adjustCounter,
    saving,
  } = useCountersList();

  const pinned = counters.slice(0, 4);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contadores"
        description="Métricas ao vivo para sua stream — qualquer evento pode virar um contador."
      >
        <Button asChild>
          <Link href="/admin/contadores/lista">Gerenciar contadores</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Contadores ativos"
          value={String(dashboard?.activeCounters ?? 0)}
          loading={loading}
        />
        <StatCard
          title="Metas em andamento"
          value={String(dashboard?.goalsInProgress ?? 0)}
          loading={loading}
        />
        <StatCard
          title="Ajustes hoje"
          value={String(dashboard?.totalAdjustmentsToday ?? 0)}
          loading={loading}
        />
        <StatCard
          title="Total"
          value={String(dashboard?.totalCounters ?? 0)}
          loading={loading}
        />
      </div>

      {pinned.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pinned.map((counter) => (
            <CounterCard
              key={counter.id}
              counter={counter}
              disabled={saving || countersLoading}
              onIncrement={() => void adjustCounter(counter.id, "increment")}
              onDecrement={() => void adjustCounter(counter.id, "decrement")}
              onReset={() => void adjustCounter(counter.id, "reset")}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <TrendingUp className="size-4" />
              Mais utilizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (dashboard?.mostUsed ?? []).length === 0 ? (
              <p className="text-body-sm text-muted-foreground">Nenhum contador ainda.</p>
            ) : (
              dashboard?.mostUsed.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-body-sm">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">{item.useCount} ops</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <Activity className="size-4" />
              Alterados recentemente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashboard?.recentlyChanged ?? []).map((item) => (
              <div key={item.counterId} className="flex items-center justify-between text-body-sm">
                <span>
                  {item.name}: <strong>{item.value}</strong>
                </span>
                <span className="text-muted-foreground">
                  {item.changedBy ? `@${item.changedBy}` : "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-body-md">
            <Hash className="size-4" />
            Histórico recente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(dashboard?.recentHistory ?? []).map((entry) => (
            <div key={entry.id} className="text-body-sm">
              <span className="font-medium">{entry.counterName}</span>:{" "}
              {entry.previousValue} → {entry.newValue}{" "}
              <span className="text-muted-foreground">
                ({entry.source}
                {entry.actorUsername ? ` · @${entry.actorUsername}` : ""})
              </span>
            </div>
          ))}
          {(dashboard?.recentHistory ?? []).length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nenhuma alteração registrada.</p>
          ) : null}
        </CardContent>
      </Card>

      {(dashboard?.goalsInProgress ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-md">
              <Target className="size-4" />
              Metas em andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted-foreground">
              {dashboard?.goalsInProgress} contador(es) com meta ainda não atingida.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
