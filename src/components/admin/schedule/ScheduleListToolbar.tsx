"use client";

import { CalendarRange } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AdminStreamerViewFilter } from "@/components/admin/shared/AdminStreamerViewFilter";
import type { AdminViewFilter } from "@/hooks/useAdminChannelOptions";
import type { ScheduleDateRange } from "@/lib/schedule-period";

interface ScheduleListToolbarProps {
  viewFilter: AdminViewFilter;
  onViewFilterChange: (v: AdminViewFilter) => void;
  viewFilterOptions: { value: AdminViewFilter; label: string }[];
  period: ScheduleDateRange;
  onPeriodChange: (p: ScheduleDateRange) => void;
}

export function ScheduleListToolbar({
  viewFilter,
  onViewFilterChange,
  viewFilterOptions,
  period,
  onPeriodChange,
}: ScheduleListToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-outline-variant/25 pb-4">
      <AdminStreamerViewFilter
        value={viewFilter}
        onChange={onViewFilterChange}
        options={viewFilterOptions}
      />

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
              onChange={(e) =>
                onPeriodChange({ ...period, from: e.target.value })
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
              onChange={(e) =>
                onPeriodChange({ ...period, to: e.target.value })
              }
              className="input-cinematic w-full min-w-[160px] sm:w-[160px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
