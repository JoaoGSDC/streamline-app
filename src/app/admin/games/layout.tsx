"use client";

import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function GamesModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuard featureKey="games" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack">{children}</div>
    </FeatureGuard>
  );
}
