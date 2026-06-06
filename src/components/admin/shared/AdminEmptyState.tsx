"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "admin-empty-state flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-low/30 px-6 py-12 text-center",
        className
      )}
    >
      <Icon className="admin-empty-icon mb-4" aria-hidden />
      <p className="admin-empty-title text-foreground">{title}</p>
      <p className="admin-empty-description mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
