import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, Calendar, Twitch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Inicializar com dados de exemplo se não houver nenhum streamer
    const streamers = localStorage.getItem("streamers");
    if (!streamers) {
      const mockStreamers = [
        {
          id: "1",
          name: "GamerPro",
          twitchUsername: "gamerpro",
          password: "demo123",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GamerPro",
          bio: "Streamer profissional de jogos variados • Live todos os dias às 20h",
          twitchUrl: "https://twitch.tv/gamerpro",
          followers: "15.2k",
        }
      ];
      localStorage.setItem("streamers", JSON.stringify(mockStreamers));

      const mockGames = [
        {
          id: "1",
          streamerId: "1",
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
          id: "2",
          streamerId: "1",
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
      ];
      localStorage.setItem("games", JSON.stringify(mockGames));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreamSchedule
          </h1>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate("/auth")}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Twitch className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreamSchedule
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organize e compartilhe a agenda dos seus jogos com sua comunidade
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Começar Agora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/gamerpro")}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Ver Exemplo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Organize
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Planeje sua agenda de jogos diária, semanal ou mensal de forma simples e visual
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitch className="h-5 w-5 text-primary" />
                Compartilhe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tenha um link único com seu nome da Twitch para compartilhar com sua comunidade
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Gerencie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Adicione, edite e remova jogos da sua agenda de forma rápida pelo painel do streamer
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
