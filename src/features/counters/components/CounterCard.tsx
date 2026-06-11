"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CounterDto } from "@server/counters/counters.types";

interface CounterCardProps {
  counter: CounterDto;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function CounterCard({
  counter,
  onIncrement,
  onDecrement,
  onReset,
  disabled,
}: CounterCardProps) {
  const progress =
    counter.goalValue && counter.goalValue > 0
      ? Math.min(100, Math.round((counter.value / counter.goalValue) * 100))
      : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2" style={{ borderTop: `3px solid ${counter.color}` }}>
        <CardTitle className="flex items-center gap-2 text-body-sm font-medium">
          {counter.emoji ? <span>{counter.emoji}</span> : null}
          <span className="truncate">{counter.name}</span>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {counter.categoryName ? (
            <p className="text-caption text-muted-foreground">{counter.categoryName}</p>
          ) : null}
          {counter.readonly ? (
            <span className="rounded-full bg-[#9146FF]/15 px-2 py-0.5 text-caption text-[#b9a3ff]">
              Twitch
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-headline text-headline-lg font-bold tabular-nums">
          {counter.value}
          {counter.goalValue ? (
            <span className="text-body-md font-normal text-muted-foreground">
              {" "}
              / {counter.goalValue}
            </span>
          ) : null}
        </p>

        {progress !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: counter.color }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onDecrement}
            disabled={disabled}
            aria-label={`Diminuir ${counter.name}`}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onIncrement}
            disabled={disabled}
            aria-label={`Incrementar ${counter.name}`}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReset}
            disabled={disabled}
            aria-label={`Resetar ${counter.name}`}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
