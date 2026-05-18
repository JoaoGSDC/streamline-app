"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingDisplayProps {
  rating?: number | null;
  className?: string;
}

/** Uma estrela preenchida + valor numérico (perfil público). */
export function StarRatingDisplay({ rating, className }: StarRatingDisplayProps) {
  const value =
    rating != null && !Number.isNaN(Number(rating))
      ? Math.min(10, Math.max(0, Number(rating)))
      : 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Star
        className="h-5 w-5 fill-[hsl(var(--status-online))] text-[hsl(var(--status-online))]"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="text-body-md font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
