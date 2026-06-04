"use client";

import {
  Coins,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEconomyOverviewPage } from "@features/economy/hooks/use-economy-overview-page.hook";

function StatCard({
  title,
  value,
  hint,
  loading,
}: {
  title: string;
  value: string;
  hint: string;
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
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-headline text-headline-md font-bold">{value}</p>
        )}
        <p className="mt-1 text-body-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function EconomyOverviewPage() {
  const { overview, loading, saving, toggleEnabled } = useEconomyOverviewPage();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <AdminPageHeader
          title="Pontuação"
          description="Gerencie pontos gratuitos do canal e prepare recompensas futuras. Coins são moedas premium da plataforma — separadas dos pontos."
        />

        <AdminSection
          title="Status do sistema"
          description="Ative a pontuação para permitir que viewers acumulem pontos durante suas lives."
        >
          <div className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-low/30 p-4">
            <div>
              <p className="font-medium text-foreground">Pontuação do canal</p>
              <p className="text-body-sm text-muted-foreground">
                {overview?.enabled
                  ? "Ativa — pontos podem ser distribuídos pelo bot."
                  : "Desativada — nenhum ponto será gerado automaticamente."}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={overview?.enabled ?? false}
                    disabled={loading || saving}
                    onCheckedChange={toggleEnabled}
                    aria-label="Ativar pontuação"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Liga ou desliga todo o sistema de pontuação do canal
              </TooltipContent>
            </Tooltip>
          </div>
        </AdminSection>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Usuários cadastrados"
            value={String(overview?.totalUsers ?? 0)}
            hint="Viewers que já interagiram com a pontuação"
            loading={loading}
          />
          <StatCard
            title="Pontos distribuídos"
            value={(overview?.totalPointsDistributed ?? 0).toLocaleString("pt-BR")}
            hint="Total acumulado no canal (não inclui coins)"
            loading={loading}
          />
          <StatCard
            title="Níveis configurados"
            value={String(overview?.activeLevelsCount ?? 0)}
            hint="Quantidade de níveis na progressão"
            loading={loading}
          />
          <StatCard
            title="Versão da config"
            value={String(overview?.configVersion ?? 1)}
            hint="Sincronizada com o bot auxiliar"
            loading={loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-title-sm">
                <Coins className="h-4 w-4 text-primary" />
                Pontos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-body-sm text-muted-foreground">
              Moeda gratuita do canal. Ganhos por assistir e interagir na live.
              {overview?.pointsEnabled ? (
                <span className="mt-2 block font-medium text-foreground">
                  Sistema de pontos ativo
                </span>
              ) : (
                <span className="mt-2 block text-muted-foreground">
                  Sistema de pontos desativado
                </span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-title-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                Níveis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-body-sm text-muted-foreground">
              Progressão opcional com XP por mensagens e tempo de live.
              {overview?.levelsEnabled ? (
                <span className="mt-2 block font-medium text-foreground">
                  Níveis ativos
                </span>
              ) : (
                <span className="mt-2 block">Níveis desativados</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-title-sm">
                <Zap className="h-4 w-4 text-primary" />
                Coins
              </CardTitle>
            </CardHeader>
            <CardContent className="text-body-sm text-muted-foreground">
              Moeda premium da plataforma (por usuário). Nunca gerada pelo
              sistema de pontos. Futuro: loja e compras reais.
            </CardContent>
          </Card>
        </div>

        {!loading && (overview?.totalUsers ?? 0) === 0 && (
          <AdminEmptyState
            icon={Users}
            title="Nenhum usuário ainda"
            description="Quando o bot integrar com a pontuação, os viewers aparecerão aqui com seus saldos de pontos."
          />
        )}
      </div>
    </TooltipProvider>
  );
}
