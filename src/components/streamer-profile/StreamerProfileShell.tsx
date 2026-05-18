"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { StreamerHeader } from "@/components/StreamerHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameModal } from "@/components/GameModal";
import { useAuth } from "@/hooks";
import {
  sectionToTab,
  tabToPath,
} from "@/lib/streamer-profile-routes";
import {
  StreamerProfileProvider,
  useStreamerProfile,
} from "@/contexts/StreamerProfileContext";
import { StreamerAgendaPanel } from "@/components/streamer-profile/StreamerAgendaPanel";
import { StreamerGamesPanel } from "@/components/streamer-profile/StreamerGamesPanel";

function StreamerProfileShellInner() {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  const section = params?.section as string[] | undefined;
  const router = useRouter();
  const activeTab = sectionToTab(section);
  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const {
    streamer,
    loadingStreamer,
    selectedGame,
    isModalOpen,
    setIsModalOpen,
  } = useStreamerProfile();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isOwnProfile = () => {
    if (!isAuthenticated || !currentUser || !streamer) return false;
    return (
      currentUser.twitchUsername.toLowerCase() ===
      streamer.twitchUsername.toLowerCase()
    );
  };

  return (
    <div className="relative z-10">
      <Header
        hideLeadingOnMobile
        leading={
          <Button
            size="sm"
            variant="outline"
            className="text-primary"
            onClick={() => router.push("/")}
          >
            Início
          </Button>
        }
        trailing={
          <div className="flex items-center gap-2">
            {isAuthenticated && currentUser ? (
              isOwnProfile() ? (
                <>
                  <Button size="sm" onClick={() => router.push("/admin")}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Painel
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive"
                    title="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/${currentUser.twitchUsername}`)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Button>
              )
            ) : (
              <Button
                size="sm"
                variant="nav-login"
                onClick={() => router.push("/auth")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        }
      />

      <main className="container-cinematic py-6">
        <Tabs value={activeTab} className="w-full">
          <StreamerHeader
            {...(streamer ?? {
              id: "",
              name: "",
              twitchUsername: slug,
              avatar: "",
              bio: "",
              twitchUrl: "",
            })}
            partner={streamer?.partner}
            premium={streamer?.premium}
            loading={loadingStreamer}
            navigation={
              <TabsList className="streamer-nav-tabs">
                <TabsTrigger
                  value="agenda"
                  className="streamer-nav-tab-trigger font-headline text-body-sm font-semibold shadow-none"
                  asChild
                >
                  <Link href={tabToPath(slug, "agenda")} scroll={false}>
                    Agenda
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="jogos"
                  className="streamer-nav-tab-trigger font-headline text-body-sm font-semibold shadow-none"
                  asChild
                >
                  <Link href={tabToPath(slug, "jogos")} scroll={false}>
                    Jogos
                  </Link>
                </TabsTrigger>
              </TabsList>
            }
          />

          <div className="streamer-divider" />

          <section className="streamer-profile-card py-4 sm:py-6">
            <StreamerAgendaPanel />
            <StreamerGamesPanel />
          </section>
        </Tabs>
      </main>

      <GameModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        game={selectedGame as never}
      />
    </div>
  );
}

export function StreamerProfileShell() {
  return (
    <StreamerProfileProvider>
      <StreamerProfileShellInner />
    </StreamerProfileProvider>
  );
}
