"use client";

import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function SorteiosLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGuard featureKey="raffles" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack h-[calc(100vh-80px)] overflow-hidden">{children}</div>
    </FeatureGuard>
  );
}
