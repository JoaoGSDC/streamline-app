import type { StoreProductRarity } from "@server/store/store.types";
import { STORE_RARITY_LABELS } from "@server/store/store.types";
import { cn } from "@/lib/utils";

const rarityStyles: Record<StoreProductRarity, string> = {
  common: "bg-muted text-muted-foreground border-outline-variant/40",
  uncommon: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rare: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  epic: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  legendary: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  mythic: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export function StoreRarityBadge({
  rarity,
  className,
}: {
  rarity: StoreProductRarity | null;
  className?: string;
}) {
  if (!rarity) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-body-xs font-medium",
        rarityStyles[rarity],
        className
      )}
    >
      {STORE_RARITY_LABELS[rarity]}
    </span>
  );
}
