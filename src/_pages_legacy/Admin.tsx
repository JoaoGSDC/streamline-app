import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks";
import Image from "next/image";

interface Game {
  id: string;
  streamerId: string;
  title: string;
  image: string;
  scheduledTime: string;
  duration: string;
  platform: string;
  synopsis: string;
  genre: string[];
  storeLinks: { name: string; url: string }[];
}

const Admin = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user: streamer, isAuthenticated, logout } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated || !streamer) {
      router.push("/auth");
      return;
    }

    // Carregar jogos do streamer
    const allGames = JSON.parse(localStorage.getItem("games") || "[]");
    const streamerGames = allGames.filter(
      (g: any) => g.streamerId === streamer.id
    );
    setGames(streamerGames);
  }, [isAuthenticated, streamer, router]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    router.push("/");
  };

  const handleAddGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Verificar se o streamer está definido
    if (!streamer) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive",
      });
      return;
    }

    const newGame: Game = {
      id: Date.now().toString(),
      title: formData.get("title") as string,
      image: formData.get("image") as string,
      scheduledTime: formData.get("scheduledTime") as string,
      duration: formData.get("duration") as string,
      platform: formData.get("platform") as string,
      synopsis: formData.get("synopsis") as string,
      genre: (formData.get("genre") as string).split(",").map((g) => g.trim()),
      storeLinks: [],
      streamerId: streamer.id,
    };

    const allGames = JSON.parse(localStorage.getItem("games") || "[]");
    allGames.push(newGame);
    localStorage.setItem("games", JSON.stringify(allGames));

    setGames([...games, newGame]);
    setShowForm(false);

    toast({
      title: "Jogo adicionado!",
      description: `${newGame.title} foi adicionado à sua agenda.`,
    });

    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteGame = (gameId: string) => {
    const allGames = JSON.parse(localStorage.getItem("games") || "[]");
    const updatedGames = allGames.filter((g: any) => g.id !== gameId);
    localStorage.setItem("games", JSON.stringify(updatedGames));

    setGames(games.filter((g) => g.id !== gameId));

    toast({
      title: "Jogo removido",
      description: "O jogo foi removido da sua agenda.",
    });
  };

  if (!isAuthenticated || !streamer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Painel do Streamer" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Bem-vindo, {streamer.name}!</CardTitle>
            <CardDescription>Gerencie sua agenda de jogos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push(`/${streamer.twitchUsername}`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver Minha Agenda Pública
              </Button>
              <Button onClick={() => setShowForm(!showForm)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? "Cancelar" : "Adicionar Jogo"}
              </Button>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle>Adicionar Novo Jogo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddGame} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Jogo</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Plataforma</Label>
                    <Input
                      id="platform"
                      name="platform"
                      placeholder="PC, PS5, Xbox..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Data e Horário</Label>
                    <Input
                      id="scheduledTime"
                      name="scheduledTime"
                      placeholder="Hoje às 20:00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração</Label>
                    <Input
                      id="duration"
                      name="duration"
                      placeholder="3 horas"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">URL da Imagem</Label>
                    <Input id="image" name="image" type="url" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre">
                      Gêneros (separados por vírgula)
                    </Label>
                    <Input
                      id="genre"
                      name="genre"
                      placeholder="Ação, Aventura, RPG"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="synopsis">Sinopse</Label>
                  <Textarea id="synopsis" name="synopsis" required />
                </div>
                <Button type="submit">Adicionar Jogo</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Meus Jogos Agendados ({games.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum jogo agendado ainda. Adicione seu primeiro jogo!
              </p>
            ) : (
              <div className="space-y-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-4 p-4  border border-border hover:border-primary/50 transition-colors"
                  >
                    <Image
                      src={game.image}
                      alt={game.title}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{game.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {game.scheduledTime} • {game.duration} • {game.platform}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGame(game.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
