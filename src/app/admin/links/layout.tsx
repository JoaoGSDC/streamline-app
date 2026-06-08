"use client";

import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function LinksModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuard featureKey="links" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack">{children}</div>
    </FeatureGuard>
  );
}
