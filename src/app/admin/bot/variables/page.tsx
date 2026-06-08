"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { services } from "@services";
import type { BotVariablesCatalogResponse } from "@services/entities/bot-variables.services";
import { BotVariablesReference } from "@features/bot/components/BotVariablesReference";

export default function BotVariablesPage() {
  const [catalog, setCatalog] = useState<BotVariablesCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await services.botVariables.getCatalog();
        setCatalog(data);
      } catch {
        setCatalog(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Variáveis do Bot"
        description="Referência completa das variáveis globais e dinâmicas usadas nas mensagens de comandos e timers."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bot/commands">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos comandos
          </Link>
        </Button>
      </AdminPageHeader>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : (
        <BotVariablesReference catalog={catalog} layout="page" />
      )}

      {catalog && (
        <div className="rounded-lg border border-outline-variant/30 p-4 text-body-sm text-muted-foreground">
          <p className="font-medium text-foreground">Dica rápida</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <code>{`{user}`}</code> — login de quem digitou o comando no chat
            </li>
            <li>
              <code>{`{displayName}`}</code> — apelido exibido dessa pessoa
            </li>
            <li>
              <code>{`{channel}`}</code> — seu canal Twitch
            </li>
            <li>
              <code>{`{streamer}`}</code> / <code>{`{streamerName}`}</code> —
              dados do streamer na StreaminHub
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
