"use client";

import { cn } from "@/lib/utils";

interface AdminTypeDotProps {
  type: "builtin" | "custom";
  label?: string;
  className?: string;
}

export function AdminTypeDot({ type, label, className }: AdminTypeDotProps) {
  const defaultLabel = type === "builtin" ? "Padrão" : "Personalizado";
  return (
    <span
      className={cn(
        "admin-type-dot",
        type === "builtin" ? "admin-type-dot--builtin" : "admin-type-dot--custom",
        className
      )}
    >
      {label ?? defaultLabel}
    </span>
  );
}
