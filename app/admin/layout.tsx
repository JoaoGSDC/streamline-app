"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminProvider, useAdminContext } from "@/components/admin/AdminProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { channels, actingAs, loading, switchChannel } = useAdminContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    document.cookie =
      "twitch_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "admin_acting_as=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("currentStreamer");
    toast({ title: "Logout realizado", description: "Até logo!" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="Painel do Streamer"
          showBrandLogo={false}
          showSearch={false}
        />
        <div className="flex gap-6 p-6">
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
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Painel do Streamer"
        showBrandLogo={false}
        showSearch={false}
        hideLeadingOnMobile
        leading={
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu do painel</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
        }
        trailing={
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        }
      />

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

      <div className="container-cinematic flex gap-6 py-6">
        <aside className="glass-panel hidden w-56 shrink-0 self-start rounded-lg border border-outline-variant/30 md:block">
          {sidebar}
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
