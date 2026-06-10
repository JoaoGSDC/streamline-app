"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { services } from "@services";
import type { CounterHistoryEntryDto } from "@server/counters/counters.types";

export default function CounterHistoryPage() {
  const [history, setHistory] = useState<CounterHistoryEntryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.counters.listHistory({ limit: 100 });
      setHistory(result.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Histórico"
        description="Auditoria de quem alterou cada contador e quando."
      />

      {loading ? (
        <p className="text-body-sm text-muted-foreground">Carregando...</p>
      ) : history.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
                <div>
                  <p className="font-medium">{entry.counterName}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {entry.previousValue} → {entry.newValue} · {entry.operation}
                  </p>
                </div>
                <div className="text-right text-caption text-muted-foreground">
                  <p>{entry.source}</p>
                  {entry.actorUsername ? <p>@{entry.actorUsername}</p> : null}
                  <p>{new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
