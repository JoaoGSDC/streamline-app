"use client";

import { cn } from "@/lib/utils";

interface AdminSectionProps {
  id?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminSection({
  id,
  title,
  description,
  children,
  className,
  contentClassName,
}: AdminSectionProps) {
  return (
    <section id={id} className={cn("admin-section-panel rounded-xl", className)}>
      {(title || description) && (
        <header className="px-5 pt-5">
          {title && (
            <h2 className="text-section-title text-foreground">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-caption">{description}</p>
          )}
        </header>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
