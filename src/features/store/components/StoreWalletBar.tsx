"use client";

import Link from "next/link";
import { Coins, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StorePublicBalanceDto } from "@server/store/store.types";

interface StoreWalletBarProps {
  balance: StorePublicBalanceDto | null;
  loading: boolean;
  storeUsername: string;
  streamerName: string;
  coinsAllowed: boolean;
}

export function StoreWalletBar({
  balance,
  loading,
  storeUsername,
  streamerName,
  coinsAllowed,
}: StoreWalletBarProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl" />
        {coinsAllowed && <Skeleton className="h-20 rounded-xl" />}
      </div>
    );
  }

  if (!balance?.authenticated) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Entre para ver seu saldo e resgatar</p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Conecte sua conta Twitch para acumular pontos na live de{" "}
              {streamerName} e usar na loja.
            </p>
          </div>
          <Button asChild>
            <Link href={`/auth?returnTo=${encodeURIComponent(`/store/${storeUsername}`)}`}>
              <LogIn className="mr-2 h-4 w-4" />
              Entrar com Twitch
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        coinsAllowed
          ? "grid gap-3 sm:grid-cols-2"
          : "grid gap-3"
      }
    >
      <div className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-card p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-body-xs uppercase tracking-wide text-muted-foreground">
            Seus pontos
          </p>
          <p className="font-headline text-headline-sm font-bold">
            {(balance.points ?? 0).toLocaleString("pt-BR")}
          </p>
          <p className="text-body-xs text-muted-foreground">
            Canal de {streamerName}
          </p>
        </div>
      </div>

      {coinsAllowed && balance.coins !== null && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-body-xs uppercase tracking-wide text-muted-foreground">
              Suas coins
            </p>
            <p className="font-headline text-headline-sm font-bold text-amber-600">
              {balance.coins.toLocaleString("pt-BR")}
            </p>
            <p className="text-body-xs text-muted-foreground">
              Moeda premium da plataforma
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
