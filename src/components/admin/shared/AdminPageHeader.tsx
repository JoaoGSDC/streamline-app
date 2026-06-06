"use client";

import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <AdminBreadcrumb />
        <h1 className="text-page-title text-foreground">{title}</h1>
        {description && (
          <p className="max-w-2xl text-body-admin text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
