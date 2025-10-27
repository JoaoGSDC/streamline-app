import { useState } from "react";
import { StreamerHeader } from "@/components/StreamerHeader";
import { ViewToggle, ViewType } from "@/components/ViewToggle";
import { GameCard } from "@/components/GameCard";
import { GameModal } from "@/components/GameModal";
import { Button } from "@/components/ui/button";
import { LogIn, Settings } from "lucide-react";

// Mock data
const streamerData = {
  name: "GamerPro",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GamerPro",
  bio: "Streamer profissional de jogos variados • Live todos os dias às 20h",
  twitchUrl: "https://twitch.tv/gamerpro",
  followers: "15.2k",
};

const mockGames = [
  {
    id: 1,
    title: "The Legend of Zelda: Tears of the Kingdom",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
    scheduledTime: "Hoje às 20:00",
    duration: "3 horas",
    platform: "Nintendo Switch",
    synopsis: "Uma aventura épica no reino de Hyrule, onde Link deve explorar terras desconhecidas e enfrentar novos desafios para salvar o reino.",
    genre: ["Aventura", "Ação", "RPG"],
    storeLinks: [
      { name: "Nintendo eShop", url: "https://nintendo.com" },
      { name: "Amazon", url: "https://amazon.com" },
    ],
  },
  {
    id: 2,
    title: "Elden Ring",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
    scheduledTime: "Hoje às 23:00",
    duration: "2 horas",
    platform: "PC",
    synopsis: "Um RPG de ação em mundo aberto criado por FromSoftware e George R.R. Martin. Explore as Terras Intermédias e torne-se o Lorde Prístino.",
    genre: ["RPG", "Souls-like", "Aventura"],
    storeLinks: [
      { name: "Steam", url: "https://steam.com" },
      { name: "Epic Games", url: "https://epicgames.com" },
    ],
  },
  {
    id: 3,
    title: "Valorant",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    scheduledTime: "Amanhã às 14:00",
    duration: "4 horas",
    platform: "PC",
    synopsis: "FPS tático 5v5 com personagens únicos chamados Agentes. Combine habilidades com jogabilidade tática para vitória.",
    genre: ["FPS", "Tático", "Competitivo"],
    storeLinks: [
      { name: "Riot Games", url: "https://playvalorant.com" },
    ],
  },
];

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("daily");
  const [selectedGame, setSelectedGame] = useState<typeof mockGames[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGameClick = (game: typeof mockGames[0]) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo mobile */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreamSchedule
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Settings className="h-5 w-5" />
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(145,70,255,0.3)]">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StreamerHeader {...streamerData} />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-foreground">{getViewTitle()}</h2>
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockGames.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              image={game.image}
              scheduledTime={game.scheduledTime}
              duration={game.duration}
              platform={game.platform}
              onClick={() => handleGameClick(game)}
            />
          ))}
        </div>
      </main>

      <GameModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        game={selectedGame}
      />
    </div>
  );
};

export default Index;
