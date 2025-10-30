"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StreamerHeader } from "@/components/StreamerHeader";
import { ViewToggle, ViewType } from "@/components/ViewToggle";
import { DailyView } from "@/components/schedule/DailyView";
import { WeeklyView } from "@/components/schedule/WeeklyView";
import { CalendarView } from "@/components/schedule/CalendarView";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks";
import { GameModal } from "@/components";

export default function StreamerSchedule() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user: currentUser, isAuthenticated, logout } = useAuth();

  const [currentView, setCurrentView] = useState<ViewType>("daily");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamer, setStreamer] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loadingStreamer, setLoadingStreamer] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      console.error("Twitch API credentials are missing.");
      router.push("/");
      return;
    }

    const fetchAccessToken = async (): Promise<string> => {
      const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!res.ok) throw new Error("Failed to obtain Twitch access token");

      const data = await res.json();
      return data.access_token;
    };

    const fetchStreamerBySlug = async (accessToken: string) => {
      const res = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(slug)}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch Twitch user");

      const data = await res.json();
      return data.data?.[0];
    };

    const normalizeStreamer = (apiStreamer: any, accessToken: string) => ({
      id: apiStreamer.id,
      name: apiStreamer.display_name || apiStreamer.login,
      twitchUsername: apiStreamer.login,
      avatar: apiStreamer.profile_image_url,
      bio: apiStreamer.description || "",
      twitchUrl: `https://twitch.tv/${apiStreamer.login}`,
      followers: "", // followers count not directly available here
      accessToken,
      broadcasterType: apiStreamer.broadcaster_type,
      createdAt: apiStreamer.created_at,
    });

    const fetchStreamerAndGames = async () => {
      setLoadingStreamer(true);

      try {
        const accessToken = await fetchAccessToken();
        const apiStreamer = await fetchStreamerBySlug(accessToken);

        if (!apiStreamer) throw new Error("Streamer not found");

        const normalizedStreamer = normalizeStreamer(apiStreamer, accessToken);
        setStreamer(normalizedStreamer);

        // Buscar streams agendadas no backend
        const res = await fetch(
          `/api/scheduled-streams?streamerId=${normalizedStreamer.id}`
        );
        const streams = await res.json();

        // Mapear jogos base
        const baseMapped = (Array.isArray(streams) ? streams : []).map(
          (s: any) => {
            const igdbId =
              s.game?.igdbId || s.igdbGameId || s.igdb_game_id || null;
            return {
              id: s.id,
              title: s.game?.title || s.gameTitle || "Jogo",
              image: (() => {
                const raw = s.game?.image || s.gameImage || null;
                if (!raw)
                  return "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
                const full = raw.startsWith("//") ? `https:${raw}` : raw;
                let url = full.replace("/t_thumb/", "/t_1080p/");
                if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
                return url;
              })(),
              scheduledTime: new Date(s.scheduledDate).toLocaleString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              scheduledAt: new Date(s.scheduledDate).getTime(),
              duration: s.duration,
              platform: s.game?.platform || "",
              synopsis: s.game?.synopsis || s.gameSynopsis || "",
              streamUrl: `https://twitch.tv/${normalizedStreamer.twitchUsername}`,
              website: undefined as string | undefined,
              storeLinks: [] as Array<{ name: string; url: string }>,
              igdbId,
              raw: s,
            };
          }
        );

        // Enriquecer com websites/lojas para itens com igdbId
        const enriched = await Promise.all(
          baseMapped.map(async (g: any) => {
            if (!g.igdbId) return g;
            try {
              const res = await fetch(`/api/igdb/games/${g.igdbId}`);
              if (!res.ok) return g;
              const data = await res.json();
              const details = data?.game;
              if (!details) return g;
              return {
                ...g,
                website: details.website || g.website,
                storeLinks: Array.isArray(details.storeLinks)
                  ? details.storeLinks
                  : g.storeLinks,
              };
            } catch {
              return g;
            }
          })
        );

        setGames(enriched.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt));
      } catch (err) {
        console.error("Failed to fetch streamer data:", err);
        router.push("/");
      } finally {
        setLoadingStreamer(false);
      }
    };

    fetchStreamerAndGames();
  }, [slug, router]);

  const handleGameClick = (game: any) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case "daily":
        return "Agenda de Hoje";
      case "weekly":
        return "Agenda da Semana";
      case "monthly":
        return "Agenda do Mês";
    }
  };

  if (!streamer || loadingStreamer) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Verificar se o usuário logado é o proprietário do perfil
  const isOwnProfile = () => {
    if (!isAuthenticated || !currentUser || !streamer) return false;
    return currentUser.twitchUsername === streamer.twitchUsername;
  };

  return (
    <div className="relative z-10">
      <header className="relative top-2 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="text-primary"
            onClick={() => router.push("/")}
          >
            Início
          </Button>

          <div className="flex items-center gap-2">
            {isAuthenticated && currentUser ? (
              isOwnProfile() ? (
                <>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => router.push("/admin")}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Painel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </Button>
              )
            ) : (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push("/auth")}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StreamerHeader {...streamer} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {getViewTitle()}
          </h2>
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {currentView === "daily" && (
          <DailyView games={games} onGameClick={handleGameClick} />
        )}
        {currentView === "weekly" && (
          <WeeklyView games={games} onGameClick={handleGameClick} />
        )}
        {currentView === "monthly" && (
          <CalendarView games={games} onGameClick={handleGameClick} />
        )}
      </main>

      <GameModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        game={selectedGame}
      />
    </div>
  );
}
