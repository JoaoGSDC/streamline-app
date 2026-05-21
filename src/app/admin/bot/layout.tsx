"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BotSubNav } from "@/components/admin/bot/BotSubNav";
import { useAdminContext } from "@/components/admin/AdminProvider";

export default function BotModuleLayout({
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
    <div>
      <BotSubNav />
      {children}
    </div>
  );
}
