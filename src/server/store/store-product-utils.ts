import type { StoreProductDto } from "@server/store/store.types";
import type { StoreProductSort } from "@server/store/store.types";

export function buildPixiePurchaseUrl(username: string): string {
  return `https://pixie.gg/${username.trim().toLowerCase()}`;
}

export function resolvePixieUsername(
  pixieUsername: string | null | undefined,
  twitchUsername: string
): string {
  return (pixieUsername?.trim() || twitchUsername).toLowerCase();
}

/** Produto visível no catálogo público conforme regras de Coins do canal */
export function isProductVisibleInPublicCatalog(
  product: StoreProductDto,
  coinsAllowed: boolean
): boolean {
  if (product.secret) return false;
  if (coinsAllowed) return true;
  if (product.priceMode === "coins_only") return false;
  if (product.priceMode === "combined" && product.priceCoins > 0) return false;
  return true;
}

export function productRequiresCoins(product: StoreProductDto): boolean {
  return (
    product.priceMode === "coins_only" ||
    (product.priceMode === "combined" && product.priceCoins > 0) ||
    (product.priceMode === "either" && product.priceCoins > 0 && product.pricePoints <= 0)
  );
}

export function getProductPointsSortValue(product: StoreProductDto): number {
  if (product.priceMode === "coins_only") return Number.MAX_SAFE_INTEGER;
  if (product.priceMode === "either" && product.pricePoints <= 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  return product.pricePoints;
}

export function getProductCoinsSortValue(product: StoreProductDto): number {
  if (product.priceMode === "points_only") return Number.MAX_SAFE_INTEGER;
  if (product.priceMode === "either" && product.priceCoins <= 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  return product.priceCoins;
}

export function sortStoreProducts(
  products: StoreProductDto[],
  sort: StoreProductSort
): StoreProductDto[] {
  const list = [...products];

  switch (sort) {
    case "name_asc":
      return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    case "name_desc":
      return list.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
    case "points_asc":
      return list.sort(
        (a, b) => getProductPointsSortValue(a) - getProductPointsSortValue(b)
      );
    case "points_desc":
      return list.sort(
        (a, b) => getProductPointsSortValue(b) - getProductPointsSortValue(a)
      );
    case "coins_asc":
      return list.sort(
        (a, b) => getProductCoinsSortValue(a) - getProductCoinsSortValue(b)
      );
    case "coins_desc":
      return list.sort(
        (a, b) => getProductCoinsSortValue(b) - getProductCoinsSortValue(a)
      );
    case "newest":
      return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "default":
    default:
      return list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR"));
  }
}

export function canAffordProduct(
  product: StoreProductDto,
  points: number,
  coins: number,
  payWith?: "points" | "coins" | "combined"
): boolean {
  switch (product.priceMode) {
    case "points_only":
      return points >= product.pricePoints;
    case "coins_only":
      return coins >= product.priceCoins;
    case "combined":
      return points >= product.pricePoints && coins >= product.priceCoins;
    case "either": {
      const mode = payWith ?? (product.pricePoints > 0 ? "points" : "coins");
      if (mode === "points") return points >= product.pricePoints;
      if (mode === "coins") return coins >= product.priceCoins;
      return false;
    }
    default:
      return false;
  }
}
