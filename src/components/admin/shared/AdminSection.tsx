"use client";

import { cn } from "@/lib/utils";

interface AdminSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: AdminSectionProps) {
  return (
    <section className={cn("admin-section-panel rounded-xl", className)}>
      {(title || description) && (
        <header className="border-b border-outline-variant/30 px-5 py-4 sm:px-6">
          {title && (
            <h2 className="font-headline text-title-md font-semibold text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-body-sm text-muted-foreground">
              {description}
            </p>
          )}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", contentClassName)}>{children}</div>
    </section>
  );
}
