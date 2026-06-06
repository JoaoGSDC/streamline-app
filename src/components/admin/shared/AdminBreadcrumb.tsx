"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveAdminBreadcrumbs } from "@/lib/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminBreadcrumbProps {
  className?: string;
}

export function AdminBreadcrumb({ className }: AdminBreadcrumbProps) {
  const pathname = usePathname() ?? "";
  const items = resolveAdminBreadcrumbs(pathname);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-1", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <span className="text-muted-foreground/50" aria-hidden>
                  ›
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    isLast ? "font-medium text-primary" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
