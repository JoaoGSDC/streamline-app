"use client";

import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function QuotesModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuard featureKey="quotes" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack">{children}</div>
    </FeatureGuard>
  );
}
