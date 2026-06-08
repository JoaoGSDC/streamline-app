"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Shield } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminProvider, useAdminContext } from "@/components/admin/AdminProvider";
import { usePanelConfig } from "@/contexts/PanelConfigContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanIndicator } from "@/components/panel/PlanIndicator";
import { useToast } from "@/hooks/use-toast";

export function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { channels, actingAs, loading, switchChannel, logout } = useAdminContext();
  const { isLoading: panelRefreshing } = usePanelConfig();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    void (async () => {
      try {
        await logout();
      } catch (logoutError) {
        console.error(logoutError);
      }
      toast({ title: "Logout realizado", description: "Até logo!" });
      router.push("/");
    })();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex gap-6 p-4 md:p-6">
          <Skeleton className="hidden h-[400px] w-56 shrink-0 md:block" />
          <Skeleton className="h-[400px] flex-1" />
        </div>
      </div>
    );
  }

  if (!actingAs) return null;

  const sidebar = (
    <AdminSidebar
      channels={channels}
      actingAs={actingAs}
      onSwitchChannel={switchChannel}
      onLogout={handleLogout}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {actingAs.role === "moderator" && (
        <div className="border-b border-primary/20 bg-primary-container/15">
          <div className="container-cinematic flex items-center gap-2 py-2.5 text-body-sm text-foreground">
            <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              Você está moderando o canal{" "}
              <strong className="font-semibold">@{actingAs.twitchUsername}</strong>
              . As alterações afetam o perfil público dele.
            </span>
          </div>
        </div>
      )}

      {panelRefreshing ? (
        <div className="border-b border-outline-variant/20 bg-muted/20 px-4 py-1.5 text-center text-caption text-muted-foreground">
          Atualizando personalização do painel…
        </div>
      ) : null}

      <div className="container-cinematic flex gap-6 py-4 md:py-6">
        <aside className="glass-panel hidden w-56 shrink-0 self-start rounded-lg border border-outline-variant/30 md:block">
          {sidebar}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 space-y-3">
            <div className="flex items-center md:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            <PlanIndicator compact className="md:hidden" />
          </div>

          <main>{children}</main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,85vw)] border-outline-variant/30 bg-background p-0"
        >
          <SheetTitle className="sr-only">Menu do painel</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
    </div>
  );
}
