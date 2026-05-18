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
        "admin-empty-state flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/50 bg-surface-container-low/40 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="font-headline text-body-md font-semibold text-foreground">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
