import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Twitch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const twitchUsername = formData.get("twitch-username") as string;
    const password = formData.get("password") as string;

    // Simulação de login - verificar se usuário existe no localStorage
    const users = JSON.parse(localStorage.getItem("streamers") || "[]");
    const user = users.find(
      (u: any) => u.twitchUsername === twitchUsername && u.password === password
    );

    setTimeout(() => {
      if (user) {
        localStorage.setItem("currentStreamer", JSON.stringify(user));
        toast({
          title: "Login realizado!",
          description: `Bem-vindo de volta, ${user.name}!`,
        });
        navigate("/admin");
      } else {
        toast({
          title: "Erro ao fazer login",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const twitchUsername = formData.get("twitch-username") as string;
    const password = formData.get("password") as string;
    const bio = formData.get("bio") as string;

    // Simulação de cadastro - salvar no localStorage
    const users = JSON.parse(localStorage.getItem("streamers") || "[]");
    
    const userExists = users.find((u: any) => u.twitchUsername === twitchUsername);
    
    setTimeout(() => {
      if (userExists) {
        toast({
          title: "Erro ao cadastrar",
          description: "Este nome de usuário da Twitch já está em uso.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        twitchUsername,
        password,
        bio,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${twitchUsername}`,
        twitchUrl: `https://twitch.tv/${twitchUsername}`,
        followers: "0",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem("streamers", JSON.stringify(users));
      localStorage.setItem("currentStreamer", JSON.stringify(newUser));

      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso.",
      });

      navigate("/admin");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Twitch className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">StreamSchedule</CardTitle>
          <CardDescription>
            Gerencie a agenda dos seus jogos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-twitch">Usuário da Twitch</Label>
                  <Input
                    id="login-twitch"
                    name="twitch-username"
                    placeholder="seu_usuario"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome para exibição</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    placeholder="Seu Nome"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-twitch">Usuário da Twitch</Label>
                  <Input
                    id="signup-twitch"
                    name="twitch-username"
                    placeholder="seu_usuario"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-bio">Bio</Label>
                  <Input
                    id="signup-bio"
                    name="bio"
                    placeholder="Streamer profissional • Live todos os dias"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              Voltar para página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
