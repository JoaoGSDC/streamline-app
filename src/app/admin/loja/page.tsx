"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreDashboard } from "@features/store/hooks/use-store-dashboard.hook";
import { StorePriceLabel } from "@features/store/components/StorePriceLabel";
import { StoreRarityBadge } from "@features/store/components/StoreRarityBadge";
import { useAdminContext } from "@/components/admin/AdminProvider";
import { Button } from "@/components/ui/button";

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
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-headline text-headline-md font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function StoreDashboardPage() {
  const { dashboard, loading } = useStoreDashboard();
  const { actingAs } = useAdminContext();
  const publicUrl = actingAs
    ? `/store/${actingAs.twitchUsername}`
    : undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Loja Virtual"
        description="Gerencie produtos, resgates e recompensas do seu canal. Viewers podem resgatar com Points e, se parceiro, com Coins."
      >
        {publicUrl ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
              Ver loja pública
            </Link>
          </Button>
        ) : null}
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Produtos"
          value={`${dashboard?.activeProducts ?? 0} / ${dashboard?.totalProducts ?? 0}`}
          loading={loading}
        />
        <StatCard
          title="Resgates"
          value={String(dashboard?.totalRedemptions ?? 0)}
          loading={loading}
        />
        <StatCard
          title="Points gastos"
          value={(dashboard?.pointsSpent ?? 0).toLocaleString("pt-BR")}
          loading={loading}
        />
        <StatCard
          title="Coins gastas"
          value={(dashboard?.coinsSpent ?? 0).toLocaleString("pt-BR")}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Produtos populares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : (dashboard?.popularProducts.length ?? 0) === 0 ? (
              <p className="text-body-sm text-muted-foreground">
                Nenhum resgate ainda.
              </p>
            ) : (
              dashboard?.popularProducts.map(({ product, redemptionCount }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/20 p-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <StorePriceLabel product={product} />
                  </div>
                  <span className="text-body-sm text-muted-foreground">
                    {redemptionCount} resgates
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (dashboard?.lowStockProducts.length ?? 0) === 0 ? (
              <p className="text-body-sm text-muted-foreground">
                Nenhum produto com estoque baixo.
              </p>
            ) : (
              dashboard?.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/5 p-3"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-body-sm text-amber-600">
                    {product.stockQuantity} restantes
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Destaques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (dashboard?.featuredProducts.length ?? 0) === 0 ? (
              <p className="text-body-sm text-muted-foreground">
                Marque produtos como destaque na tela de Produtos.
              </p>
            ) : (
              dashboard?.featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <StoreRarityBadge rarity={product.rarity} />
                  </div>
                  <StorePriceLabel product={product} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-sm">
              <Users className="h-4 w-4 text-primary" />
              Top resgatadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (dashboard?.topRedeemers.length ?? 0) === 0 ? (
              <p className="text-body-sm text-muted-foreground">
                Ranking aparecerá após os primeiros resgates.
              </p>
            ) : (
              dashboard?.topRedeemers.map((user, index) => (
                <div
                  key={user.twitchUserId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span className="mr-2 text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium">{user.displayName}</span>
                  </div>
                  <span className="text-body-sm text-muted-foreground">
                    {user.totalRedemptions} resgates
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && (dashboard?.totalProducts ?? 0) === 0 && (
        <AdminEmptyState
          icon={ShoppingBag}
          title="Sua loja está vazia"
          description="Crie categorias e produtos para começar a receber resgates dos viewers."
          action={
            <Button asChild>
              <Link href="/admin/loja/produtos">Criar primeiro produto</Link>
            </Button>
          }
        />
      )}

      {!loading && (dashboard?.pendingRedemptions ?? 0) > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-amber-500" />
              <p className="text-body-sm">
                <strong>{dashboard?.pendingRedemptions}</strong> resgate(s)
                aguardando aprovação
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/loja/resgates?status=pending">Ver pendentes</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
