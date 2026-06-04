"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EconomySubNav } from "@/components/admin/economy/EconomySubNav";
import { useAdminContext } from "@/components/admin/AdminProvider";

export default function EconomyModuleLayout({
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
    <div className="space-y-6">
      <EconomySubNav />
      {children}
    </div>
  );
}
