"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({
  value,
  max = 10,
  className,
}: {
  value: number | null | undefined;
  max?: number;
  className?: string;
}) {
  if (value == null || value <= 0) return null;
  const display = Math.min(max, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex gap-px", className)} aria-label={`Nota ${display} de ${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < display;
        return (
          <Star
            key={index}
            className={cn(
              "h-3 w-3",
              filled
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/25"
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
