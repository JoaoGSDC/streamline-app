"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Twitch, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTwitchAuthUrl } from "@/lib/twitch-auth";
import Link from "next/link";

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "access_denied":
          setError("Você cancelou a autorização");
          break;
        case "no_code":
          setError("Nenhum código de autorização recebido");
          break;
        case "no_user":
          setError("Não foi possível obter informações do usuário");
          break;
        case "callback_error":
          setError("Erro ao processar autorização");
          break;
        default:
          setError("Erro desconhecido");
      }

      toast({
        title: "Erro de autenticação",
        description: error,
        variant: "destructive",
      });
    }
  }, [searchParams, toast, error]);

  const handleTwitchLogin = () => {
    const authUrl = getTwitchAuthUrl();
    window.location.href = authUrl;
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
          <CardDescription>Conecte-se com sua conta Twitch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3  bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleTwitchLogin}
            className="w-full bg-[#9146FF] hover:bg-[#9146FF]/90 text-white"
          >
            <Twitch className="mr-2 h-5 w-5" />
            Entrar com Twitch
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Ao entrar, você autoriza a Streamline a:</p>
            <ul className="text-left space-y-1 mb-4">
              <li>• Ver seu nome de usuário da Twitch</li>
              <li>• Ver sua foto de perfil</li>
              <li>• Visualizar informações básicas da conta</li>
            </ul>
          </div>

          <div className="text-center">
            <Button variant="link" className="text-muted-foreground" asChild>
              <Link href="/" prefetch>
                Voltar para página inicial
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={<div />}> 
      <AuthInner />
    </Suspense>
  );
}
