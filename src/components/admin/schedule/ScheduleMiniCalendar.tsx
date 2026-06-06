"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseStreamDate(value: Date | string): Date {
  const parsed = new Date(value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

interface ScheduleMiniCalendarProps {
  streams: Array<{ scheduledDate: Date | string }>;
  month: Date;
  selectedDate: Date | null;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function ScheduleMiniCalendar({
  streams,
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: ScheduleMiniCalendarProps) {
  const eventDays = useMemo(() => {
    const days = new Set<string>();
    for (const stream of streams) {
      days.add(toDateKey(parseStreamDate(stream.scheduledDate)));
    }
    return days;
  }, [streams]);

  const calendarCells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let index = 0; index < startOffset; index += 1) {
      cells.push({ date: null, key: `empty-start-${index}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      cells.push({ date, key: toDateKey(date) });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, key: `empty-end-${cells.length}` });
    }

    return cells;
  }, [month]);

  const monthLabel = month.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  const todayKey = toDateKey(new Date());

  return (
    <div className="admin-schedule-calendar rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={goToPreviousMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold capitalize">{monthLabel}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={goToNextMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {calendarCells.map((cell) => {
          if (!cell.date) {
            return <div key={cell.key} className="aspect-square" aria-hidden />;
          }

          const dateKey = toDateKey(cell.date);
          const hasEvent = eventDays.has(dateKey);
          const isSelected =
            selectedDate !== null && toDateKey(selectedDate) === dateKey;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate(cell.date!)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                isSelected
                  ? "bg-primary/15 font-semibold text-primary"
                  : "text-foreground hover:bg-muted/50",
                isToday && !isSelected && "ring-1 ring-primary/30"
              )}
            >
              {cell.date.getDate()}
              {hasEvent ? (
                <span
                  className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--neon-purple-glow))]"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function isSameCalendarDay(
  streamDate: Date | string,
  selectedDate: Date
): boolean {
  return toDateKey(parseStreamDate(streamDate)) === toDateKey(selectedDate);
}
