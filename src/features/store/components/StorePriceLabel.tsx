import type { StoreProductDto } from "@server/store/store.types";
import { Coins, Sparkles } from "lucide-react";

export function StorePriceLabel({
  product,
  coinsAllowed = true,
}: {
  product: Pick<StoreProductDto, "pricePoints" | "priceCoins" | "priceMode">;
  coinsAllowed?: boolean;
}) {
  const parts: string[] = [];

  if (
    product.priceMode === "points_only" ||
    product.priceMode === "combined" ||
    product.priceMode === "either"
  ) {
    if (product.pricePoints > 0) {
      parts.push(`${product.pricePoints.toLocaleString("pt-BR")} pts`);
    }
  }

  if (
    coinsAllowed &&
    (product.priceMode === "coins_only" ||
      product.priceMode === "combined" ||
      product.priceMode === "either")
  ) {
    if (product.priceCoins > 0) {
      parts.push(`${product.priceCoins.toLocaleString("pt-BR")} coins`);
    }
  }

  if (parts.length === 0) {
    return <span className="text-muted-foreground">Grátis</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-body-sm font-medium">
      {product.pricePoints > 0 &&
        (product.priceMode === "points_only" ||
          product.priceMode === "combined" ||
          product.priceMode === "either") && (
          <span className="inline-flex items-center gap-1 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {product.pricePoints.toLocaleString("pt-BR")}
          </span>
        )}
      {coinsAllowed &&
        product.priceCoins > 0 &&
        (product.priceMode === "coins_only" ||
          product.priceMode === "combined" ||
          product.priceMode === "either") && (
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Coins className="h-3.5 w-3.5" />
            {product.priceCoins.toLocaleString("pt-BR")}
          </span>
        )}
      {product.priceMode === "combined" && parts.length > 1 && (
        <span className="text-muted-foreground">+</span>
      )}
    </span>
  );
}
