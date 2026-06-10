"use client";

import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function CountersModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuard featureKey="counters" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack">{children}</div>
    </FeatureGuard>
  );
}
