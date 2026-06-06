"use client";

import { cn } from "@/lib/utils";

interface AdminConfigSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  showDivider?: boolean;
  className?: string;
}

export function AdminConfigSection({
  title,
  description,
  children,
  showDivider = true,
  className,
}: AdminConfigSectionProps) {
  return (
    <section className={cn("admin-config-section", className)}>
      {showDivider ? <hr className="admin-config-divider" aria-hidden /> : null}
      {title ? (
        <h2 className="admin-config-section-title text-foreground">{title}</h2>
      ) : null}
      {description ? (
        <p className="admin-config-section-desc">{description}</p>
      ) : null}
      <div className="admin-config-section-content">{children}</div>
    </section>
  );
}
