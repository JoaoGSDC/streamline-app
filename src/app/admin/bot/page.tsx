"use client";

import Link from "next/link";
import {
  AlertCircle,
  MessageSquare,
  Clock,
  Shield,
  RefreshCw,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBotActivationContext } from "@features/bot/context/BotActivationContext";
import { useBotDashboard } from "@features/bot/hooks/use-bot-dashboard.hook";

export default function BotDashboardPage() {
  const { active: botChannelActive } = useBotActivationContext();
  const { status, loading, refreshing, refresh } = useBotDashboard();

  const isOffline = status?.botServiceStatus !== "online";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bot de Stream"
        description="Configure comandos, timers e moderação para o chat da sua live na Twitch."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={refreshing || !botChannelActive}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Atualizar status
        </Button>
      </AdminPageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {isOffline && status?.message && (
            <div
              className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-body-sm"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <p>{status.message}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              label="Status do bot"
              value={
                status?.botServiceStatus === "online" ? "Online" : "Offline"
              }
              variant={status?.botServiceStatus === "online" ? "ok" : "warn"}
            />
            <StatusCard
              label="Comandos ativos"
              value={String(status?.summary.activeCommands ?? 0)}
            />
            <StatusCard
              label="Timers ativos"
              value={String(status?.summary.activeTimers ?? 0)}
            />
            <StatusCard
              label="Termos na blacklist"
              value={String(status?.summary.blacklistTerms ?? 0)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/bot/commands">
                <MessageSquare className="mr-2 h-4 w-4" />
                Novo comando
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/bot/timers">
                <Clock className="mr-2 h-4 w-4" />
                Timers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/bot/moderation">
                <Shield className="mr-2 h-4 w-4" />
                Moderação
              </Link>
            </Button>
          </div>

          <p className="text-body-sm text-muted-foreground">
            Versão da config: {status?.configVersion ?? 0}
            {status?.lastSyncAt
              ? ` · Última sync: ${new Date(status.lastSyncAt).toLocaleString("pt-BR")}`
              : " · Aguardando conexão do serviço bot"}
          </p>
        </>
      )}
    </div>
  );
}

function StatusCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "ok" | "warn";
}) {
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-4">
      <p className="text-body-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-headline text-headline-sm font-semibold ${
          variant === "ok"
            ? "text-green-600"
            : variant === "warn"
              ? "text-amber-600"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
