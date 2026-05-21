"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { Twitch, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo, BRAND_NAME } from "@/components/BrandLogo";
import { useAuthPage } from "@features/auth/hooks/use-auth-page.hook";

function AuthPageContent() {
  const { toast } = useToast();

  const onAuthError = useCallback(
    (message: string) => {
      toast({
        title: "Erro de autenticação",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const { errorMessage, isRedirecting, handleTwitchLogin } = useAuthPage({
    onAuthError,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-glow-purple">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo variant="full" href={null} className="h-10 md:h-11" priority />
          </div>
          <CardTitle className="sr-only">{BRAND_NAME}</CardTitle>
          <CardDescription>Conecte-se com sua conta Twitch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 border border-destructive/20 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          <Button
            onClick={() => void handleTwitchLogin()}
            variant="twitch"
            className="w-full"
            disabled={isRedirecting}
          >
            <Twitch className="mr-2 h-5 w-5" />
            {isRedirecting ? "Redirecionando..." : "Entrar com Twitch"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Ao entrar, você autoriza o {BRAND_NAME} a:</p>
            <ul className="mb-4 space-y-1 text-left">
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

export default function AuthPage() {
  return (
    <Suspense fallback={<div />}>
      <AuthPageContent />
    </Suspense>
  );
}
