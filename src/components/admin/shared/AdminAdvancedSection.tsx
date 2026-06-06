"use client";

import { cn } from "@/lib/utils";

interface AdminAdvancedSectionProps {
  children: React.ReactNode;
  summary?: string;
  className?: string;
  defaultOpen?: boolean;
}

export function AdminAdvancedSection({
  children,
  summary = "Opções avançadas",
  className,
  defaultOpen = false,
}: AdminAdvancedSectionProps) {
  return (
    <details className={cn("advanced-section", className)} open={defaultOpen}>
      <summary>{summary}</summary>
      <div className="advanced-section-content">{children}</div>
    </details>
  );
}
