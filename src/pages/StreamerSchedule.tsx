import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StreamerHeader } from "@/components/StreamerHeader";
import { ViewToggle, ViewType } from "@/components/ViewToggle";
import { DailyView } from "@/components/schedule/DailyView";
import { WeeklyView } from "@/components/schedule/WeeklyView";
import { MonthlyView } from "@/components/schedule/MonthlyView";
import { GameModal } from "@/components/GameModal";
import { Button } from "@/components/ui/button";
import { LogIn, Settings } from "lucide-react";

const StreamerSchedule = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
      navigate("/");
      return;
    }

    setStreamer(foundStreamer);

    // Buscar jogos do streamer
    const allGames = JSON.parse(localStorage.getItem("games") || "[]");
    const streamerGames = allGames.filter((g: any) => g.streamerId === foundStreamer.id);
    setGames(streamerGames);
  }, [slug, navigate]);

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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreamSchedule
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(145,70,255,0.3)]"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StreamerHeader {...streamer} />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-foreground">{getViewTitle()}</h2>
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
