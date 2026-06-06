"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminContext } from "@/components/admin/AdminProvider";
import { BotActivationProvider } from "@features/bot/context/BotActivationContext";
import { BotActivationPanel } from "@features/bot/components/BotActivationPanel";
import { BotModuleGate } from "@features/bot/components/BotModuleGate";

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
    <BotActivationProvider>
      <div className="admin-page-stack">
        <BotActivationPanel />
        <BotModuleGate>{children}</BotModuleGate>
      </div>
    </BotActivationProvider>
  );
}
