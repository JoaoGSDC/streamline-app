"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicStore } from "@features/store/hooks/use-public-store.hook";
import { StorePriceLabel } from "@features/store/components/StorePriceLabel";
import { StoreRarityBadge } from "@features/store/components/StoreRarityBadge";
import { StoreWalletBar } from "@features/store/components/StoreWalletBar";
import { StoreBuyCoinsPanel } from "@features/store/components/StoreBuyCoinsPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StoreProductDto, StoreProductSort } from "@server/store/store.types";
import { canAffordProduct } from "@server/store/store-product-utils";

const SORT_OPTIONS: Array<{ value: StoreProductSort; label: string; coinsOnly?: boolean }> = [
  { value: "default", label: "Ordem padrão" },
  { value: "newest", label: "Mais recentes" },
  { value: "name_asc", label: "Nome (A–Z)" },
  { value: "name_desc", label: "Nome (Z–A)" },
  { value: "points_asc", label: "Menor preço em pontos" },
  { value: "points_desc", label: "Maior preço em pontos" },
  { value: "coins_asc", label: "Menor preço em coins", coinsOnly: true },
  { value: "coins_desc", label: "Maior preço em coins", coinsOnly: true },
];

export default function PublicStorePage() {
  const params = useParams();
  const username = params?.username as string;

  const {
    catalog,
    balance,
    loading,
    balanceLoading,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    sortBy,
    setSortBy,
    filteredProducts,
    featuredProducts,
    redeemingId,
    redeem,
    userPoints,
    userCoins,
    coinsAllowed,
  } = usePublicStore(username);

  const storeDisabled =
    !loading && (!catalog || !catalog.config.enabled);

  const sortOptions = SORT_OPTIONS.filter(
    (opt) => !opt.coinsOnly || coinsAllowed
  );

  const showBuyCoinsPanel =
    coinsAllowed && catalog?.config.coinsPurchase;

  return (
    <div className="relative z-10 min-h-screen bg-background">
      <Header
        hideLeadingOnMobile
        leading={
          <Button size="sm" variant="outline" className="text-primary" asChild>
            <Link href={`/${username}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao perfil
            </Link>
          </Button>
        }
        trailing={<div className="hidden w-24 md:block" aria-hidden />}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        ) : storeDisabled ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="font-headline text-headline-md font-bold">
              Loja indisponível
            </h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              Esta loja não está ativa no momento. Volte mais tarde!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <Avatar className="h-16 w-16">
                <AvatarImage src={catalog!.streamer.avatar ?? undefined} />
                <AvatarFallback>
                  {catalog!.streamer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-headline text-headline-lg font-bold">
                  Loja de {catalog!.streamer.name}
                </h1>
                <p className="text-muted-foreground">
                  Resgate recompensas com pontos
                  {coinsAllowed ? " ou coins premium" : ""}
                </p>
              </div>
            </header>

            <StoreWalletBar
              balance={balance}
              loading={balanceLoading}
              storeUsername={username}
              streamerName={catalog!.streamer.name}
              coinsAllowed={coinsAllowed}
            />

            {showBuyCoinsPanel && catalog!.config.coinsPurchase && (
              <StoreBuyCoinsPanel
                pixieUrl={catalog!.config.coinsPurchase.pixieUrl}
                pixieUsername={catalog!.config.coinsPurchase.pixieUsername}
                streamerName={catalog!.streamer.name}
                userCoins={userCoins}
                authenticated={balance?.authenticated ?? false}
              />
            )}

            {coinsAllowed && !balance?.authenticated && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-body-sm text-muted-foreground">
                Este canal aceita <strong className="text-amber-600">Coins</strong>{" "}
                premium. Entre com Twitch para ver seu saldo completo na loja.
              </div>
            )}

            {featuredProducts.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-headline text-title-md font-semibold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Destaques
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeUsername={username}
                      coinsAllowed={coinsAllowed}
                      authenticated={balance?.authenticated ?? false}
                      userPoints={userPoints}
                      userCoins={userCoins}
                      redeeming={redeemingId === product.id}
                      onRedeem={(payWith) => void redeem(product, payWith)}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar produtos…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {catalog!.categories
                    .filter((c) => c.enabled)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as StoreProductSort)}
              >
                <SelectTrigger className="w-full lg:w-56">
                  <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeUsername={username}
                    coinsAllowed={coinsAllowed}
                    authenticated={balance?.authenticated ?? false}
                    userPoints={userPoints}
                    userCoins={userCoins}
                    redeeming={redeemingId === product.id}
                    onRedeem={(payWith) => void redeem(product, payWith)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({
  product,
  storeUsername,
  coinsAllowed,
  authenticated,
  userPoints,
  userCoins,
  redeeming,
  onRedeem,
}: {
  product: StoreProductDto;
  storeUsername: string;
  coinsAllowed: boolean;
  authenticated: boolean;
  userPoints: number;
  userCoins: number;
  redeeming: boolean;
  onRedeem: (payWith?: "points" | "coins" | "combined") => void;
}) {
  const [payWith, setPayWith] = useState<"points" | "coins">(
    product.pricePoints > 0 ? "points" : "coins"
  );

  const outOfStock =
    !product.stockUnlimited && (product.stockQuantity ?? 0) <= 0;

  const needsPayChoice = product.priceMode === "either" && coinsAllowed;
  const effectivePayWith =
    product.priceMode === "combined"
      ? "combined"
      : product.priceMode === "either"
        ? payWith
        : product.priceMode === "coins_only"
          ? "coins"
          : "points";

  const affordable =
    authenticated &&
    canAffordProduct(product, userPoints, userCoins, effectivePayWith);

  const showInsufficient =
    authenticated && !affordable && !outOfStock;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-card shadow-sm">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt=""
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-muted/30">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{product.name}</h3>
          <StoreRarityBadge rarity={product.rarity} />
        </div>
        {product.shortDescription && (
          <p className="mb-3 line-clamp-2 text-body-sm text-muted-foreground">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto space-y-3 pt-2">
          <StorePriceLabel product={product} coinsAllowed={coinsAllowed} />
          {!product.stockUnlimited && (
            <p className="text-body-xs text-muted-foreground">
              {outOfStock
                ? "Esgotado"
                : `${product.stockQuantity} disponíveis`}
            </p>
          )}
          {needsPayChoice && (
            <Select
              value={payWith}
              onValueChange={(v) => setPayWith(v as "points" | "coins")}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {product.pricePoints > 0 && (
                  <SelectItem value="points">
                    Pagar com {product.pricePoints.toLocaleString("pt-BR")} pts
                  </SelectItem>
                )}
                {product.priceCoins > 0 && (
                  <SelectItem value="coins">
                    Pagar com {product.priceCoins.toLocaleString("pt-BR")} coins
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          {showInsufficient && (
            <p className="text-body-xs text-destructive">
              Saldo insuficiente para este produto.
            </p>
          )}
          {!authenticated ? (
            <Button className="w-full" asChild disabled={outOfStock}>
              <Link
                href={`/auth?returnTo=${encodeURIComponent(`/store/${storeUsername}`)}`}
              >
                Entrar para resgatar
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={outOfStock || redeeming || !affordable}
              onClick={() => onRedeem(effectivePayWith)}
            >
              {redeeming
                ? "Resgatando…"
                : outOfStock
                  ? "Esgotado"
                  : showInsufficient
                    ? "Saldo insuficiente"
                    : "Resgatar"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
