"use client";

import { CalendarRange, CalendarDays, List } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AdminViewFilter } from "@/hooks/useAdminChannelOptions";
import type { ScheduleDateRange } from "@/lib/schedule-period";
import { cn } from "@/lib/utils";

export type ScheduleViewMode = "list" | "calendar";

interface ScheduleListToolbarProps {
  viewFilter: AdminViewFilter;
  onViewFilterChange: (v: AdminViewFilter) => void;
  showChannelFilter: boolean;
  period: ScheduleDateRange;
  onPeriodChange: (p: ScheduleDateRange) => void;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  totalCount: number;
}

export function ScheduleListToolbar({
  viewFilter,
  onViewFilterChange,
  showChannelFilter,
  period,
  onPeriodChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: ScheduleListToolbarProps) {
  const countLabel =
    totalCount === 1
      ? "1 stream encontrada"
      : `${totalCount} streams encontradas`;

  return (
    <div className="space-y-4 border-b border-outline-variant/25 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-outline-variant/30 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-label transition-colors",
              viewMode === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-label transition-colors",
              viewMode === "calendar"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendário
          </button>
        </div>

        <p className="text-body-sm text-muted-foreground">{countLabel}</p>
      </div>

      {showChannelFilter ? (
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "mine" as const, label: "Meu canal" },
              { value: "all" as const, label: "Todos os canais" },
            ] as const
          ).map((filter) => {
            const active = viewFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onViewFilterChange(filter.value)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-label transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/30 text-muted-foreground hover:bg-muted/40"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Label className="flex w-full items-center gap-2 text-body-sm text-muted-foreground sm:w-auto">
          <CalendarRange className="h-4 w-4" />
          Período
        </Label>
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-from" className="text-caption text-muted-foreground">
              Data início
            </Label>
            <Input
              id="schedule-from"
              type="date"
              value={period.from}
              onChange={(event) =>
                onPeriodChange({ ...period, from: event.target.value })
              }
              className="input-cinematic w-full min-w-[160px] sm:w-[160px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-to" className="text-caption text-muted-foreground">
              Data fim
            </Label>
            <Input
              id="schedule-to"
              type="date"
              value={period.to}
              min={period.from || undefined}
              onChange={(event) =>
                onPeriodChange({ ...period, to: event.target.value })
              }
              className="input-cinematic w-full min-w-[160px] sm:w-[160px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
