"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PublicStorePage() {
  const params = useParams();
  const username = params?.username as string;

  const {
    catalog,
    loading,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    filteredProducts,
    featuredProducts,
    redeemingId,
    redeem,
  } = usePublicStore(username);

  const storeDisabled =
    !loading && (!catalog || !catalog.config.enabled || !catalog.config);

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
          <>
            <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
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
                  {catalog!.config.coinsAllowed ? " ou coins" : ""}
                </p>
              </div>
            </header>

            {featuredProducts.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 font-headline text-title-md font-semibold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Destaques
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      coinsAllowed={catalog!.config.coinsAllowed}
                      redeeming={redeemingId === product.id}
                      onRedeem={() => void redeem(product.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
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
                <SelectTrigger className="w-full sm:w-48">
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
                    coinsAllowed={catalog!.config.coinsAllowed}
                    redeeming={redeemingId === product.id}
                    onRedeem={() => void redeem(product.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ProductCard({
  product,
  coinsAllowed,
  redeeming,
  onRedeem,
}: {
  product: import("@server/store/store.types").StoreProductDto;
  coinsAllowed: boolean;
  redeeming: boolean;
  onRedeem: () => void;
}) {
  const outOfStock =
    !product.stockUnlimited && (product.stockQuantity ?? 0) <= 0;

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
          <Button
            className="w-full"
            disabled={outOfStock || redeeming}
            onClick={onRedeem}
          >
            {redeeming ? "Resgatando…" : outOfStock ? "Esgotado" : "Resgatar"}
          </Button>
        </div>
      </div>
    </article>
  );
}
