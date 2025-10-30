"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Twitch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFormValidation } from "@/hooks";
import { StreamerService } from "@/services";
import { LoginFormData, SignupFormData, Streamer } from "@/types";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants";
import { ErrorHandler } from "@/utils";

export const AuthForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const { validateUsername, validatePassword } = useFormValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({});
  const [signupErrors, setSignupErrors] = useState<Partial<SignupFormData>>({});

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const credentials: LoginFormData = {
        twitchUsername: formData.get("twitch-username") as string,
        password: formData.get("password") as string,
      };

      // Validação
      const usernameError = validateUsername(credentials.twitchUsername);
      const passwordError = validatePassword(credentials.password);

      if (usernameError || passwordError) {
        setLoginErrors({
          twitchUsername: usernameError || undefined,
          password: passwordError || undefined,
        });
        return;
      }

      // Simulação de delay para UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = StreamerService.authenticate(credentials);
      login(user as Streamer);

      toast({
        title: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        description: `Bem-vindo de volta, ${user?.name}!`,
      });

      router.push("/admin");
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error);
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const userData: SignupFormData = {
        name: formData.get("name") as string,
        twitchUsername: formData.get("twitch-username") as string,
        password: formData.get("password") as string,
        bio: formData.get("bio") as string,
      };

      // Validação
      const usernameError = validateUsername(userData.twitchUsername);
      const passwordError = validatePassword(userData.password);

      if (usernameError || passwordError) {
        setSignupErrors({
          twitchUsername: usernameError || undefined,
          password: passwordError || undefined,
        });
        return;
      }

      // Simulação de delay para UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser = StreamerService.create(userData);
      login(newUser);

      toast({
        title: SUCCESS_MESSAGES.SIGNUP_SUCCESS,
        description: "Sua conta foi criada com sucesso.",
      });

      router.push("/admin");
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error);
      toast({
        title: "Erro ao cadastrar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <CardTitle className="text-2xl font-bold">Streamline</CardTitle>
          <CardDescription>Gerencie a agenda dos seus jogos</CardDescription>
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
                    className={
                      loginErrors.twitchUsername ? "border-destructive" : ""
                    }
                  />
                  {loginErrors.twitchUsername && (
                    <p className="text-sm text-destructive">
                      {loginErrors.twitchUsername}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    disabled={isLoading}
                    className={loginErrors.password ? "border-destructive" : ""}
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">
                      {loginErrors.password}
                    </p>
                  )}
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
                    className={
                      signupErrors.twitchUsername ? "border-destructive" : ""
                    }
                  />
                  {signupErrors.twitchUsername && (
                    <p className="text-sm text-destructive">
                      {signupErrors.twitchUsername}
                    </p>
                  )}
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
                    className={
                      signupErrors.password ? "border-destructive" : ""
                    }
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive">
                      {signupErrors.password}
                    </p>
                  )}
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
              onClick={() => router.push("/")}
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
