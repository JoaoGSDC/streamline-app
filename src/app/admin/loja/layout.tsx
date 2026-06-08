"use client";

import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function StoreModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuard featureKey="store" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack">{children}</div>
    </FeatureGuard>
  );
}
