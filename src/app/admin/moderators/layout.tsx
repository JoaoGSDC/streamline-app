"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminContext } from "@/components/admin/AdminProvider";
import { FeatureGuard } from "@/components/panel/FeatureGuard";

export default function ModeratorsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { actingAs, loading } = useAdminContext();

  useEffect(() => {
    if (loading) return;
    if (!actingAs) return;
    if (actingAs.role !== "owner") {
      router.replace("/admin");
    }
  }, [actingAs, loading, router]);

  if (loading || !actingAs || actingAs.role !== "owner") {
    return null;
  }

  return (
    <FeatureGuard featureKey="moderators" redirectTo="/admin/feature-disabled">
      <div className="admin-page-stack">{children}</div>
    </FeatureGuard>
  );
}
