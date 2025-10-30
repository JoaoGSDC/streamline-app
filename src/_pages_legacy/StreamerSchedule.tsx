import { useState, useEffect } from "react";
import { StreamerHeader } from "@/components/StreamerHeader";
import { ViewToggle, ViewType } from "@/components/ViewToggle";
import { DailyView } from "@/components/schedule/DailyView";
import { WeeklyView } from "@/components/schedule/WeeklyView";
import { MonthlyView } from "@/components/schedule/MonthlyView";
import { GameModal } from "@/components/GameModal";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";

const StreamerSchedule = () => {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>("daily");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamer, setStreamer] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    // Buscar streamer pelo slug
    const streamers = JSON.parse(localStorage.getItem("streamers") || "[]");
    const foundStreamer = streamers.find((s: any) => s.twitchUsername === slug);

    if (!foundStreamer) {
      router.push("/");
      return;
    }

    setStreamer(foundStreamer);

    // Buscar jogos do streamer
    const allGames = JSON.parse(localStorage.getItem("games") || "[]");
    const streamerGames = allGames.filter(
      (g: any) => g.streamerId === foundStreamer.id
    );
    setGames(streamerGames);
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

  if (!streamer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
          <MonthlyView games={games} onGameClick={handleGameClick} />
        )}
      </main>

      <GameModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        game={selectedGame}
      />
    </div>
  );
};

export default StreamerSchedule;
