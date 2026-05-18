"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}

export function StarRatingInput({
  value,
  onChange,
  max = 10,
  className,
}: StarRatingInputProps) {
  const display = value ?? 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div
        className="flex gap-0.5"
        role="group"
        aria-label={`Nota de 0 a ${max}`}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const filled = starValue <= display;
          return (
            <button
              key={starValue}
              type="button"
              tabIndex={-1}
              onClick={() => onChange(starValue)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label={`${starValue} estrela${starValue > 1 ? "s" : ""}`}
              aria-pressed={filled}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  filled
                    ? "fill-[hsl(var(--status-online))] text-[hsl(var(--status-online))]"
                    : "fill-none text-muted-foreground/70"
                )}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>
      <span className="min-w-[1.25rem] text-body-sm font-semibold tabular-nums text-foreground">
        {display}
      </span>
    </div>
  );
}
