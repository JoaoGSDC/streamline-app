import type { StoreProductRarity } from "@server/store/store.types";
import { STORE_RARITY_LABELS } from "@server/store/store.types";
import { cn } from "@/lib/utils";

export function StoreRarityBadge({
  rarity,
  className,
}: {
  rarity: StoreProductRarity | null;
  className?: string;
}) {
  if (!rarity) return null;
  return (
    <span className={cn("text-caption", className)}>
      {STORE_RARITY_LABELS[rarity]}
    </span>
  );
}
