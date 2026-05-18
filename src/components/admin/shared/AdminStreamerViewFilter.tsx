"use client";

import { Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminViewFilter } from "@/hooks/useAdminChannelOptions";
import { cn } from "@/lib/utils";

interface AdminStreamerViewFilterProps {
  value: AdminViewFilter;
  onChange: (filter: AdminViewFilter) => void;
  options: { value: AdminViewFilter; label: string }[];
  className?: string;
}

export function AdminStreamerViewFilter({
  value,
  onChange,
  options,
  className,
}: AdminStreamerViewFilterProps) {
  if (options.length <= 1) return null;

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3", className)}>
      <Label className="flex shrink-0 items-center gap-2 text-body-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        Exibir
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as AdminViewFilter)}>
        <SelectTrigger className="input-cinematic w-full sm:w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
