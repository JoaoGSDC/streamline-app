import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Calendar, Twitch } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth, useMockData } from "@/hooks";
import { APP_CONFIG } from "@/constants";

const Index = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isInitialized } = useMockData();

  const handleAccess = () => {
    if (isAuthenticated && user) {
      router.push(`/${user.twitchUsername}`);
    } else {
      router.push("/auth");
    }
  };

  const handleAdminAccess = () => {
    if (isAuthenticated && user) {
      router.push("/admin");
    } else {
      router.push("/auth");
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Twitch className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {APP_CONFIG.name}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organize e compartilhe a agenda dos seus jogos com sua comunidade
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleAdminAccess}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/fantonlord")}
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
                Planeje sua agenda de jogos diária, semanal ou mensal de forma
                simples e visual
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
                Tenha um link único com seu nome da Twitch para compartilhar com
                sua comunidade
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
                Adicione, edite e remova jogos da sua agenda de forma rápida
                pelo painel do streamer
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
