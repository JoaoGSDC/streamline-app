"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogIn, Calendar, Twitch } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getCurrentStreamer() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentStreamer");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Index() {
  const router = useRouter();
  const [currentStreamer, setCurrentStreamer] = useState<any>(null);

  useEffect(() => {
    // Inicializa com o estado atual do localStorage
    setCurrentStreamer(getCurrentStreamer());

    // Atualiza quando o localStorage mudar em outra aba/janela
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentStreamer") {
        setCurrentStreamer(getCurrentStreamer());
      }
    };

    // Atualiza ao voltar o foco para a aba (caso logout ocorra em outra rota)
    const onFocus = () => setCurrentStreamer(getCurrentStreamer());

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleAccess = () => {
    if (currentStreamer) {
      router.push(`/${currentStreamer.twitchUsername}`);
    } else {
      router.push("/auth");
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* BACKGROUND IMAGE + GRADIENT */}
      <div className="absolute inset-0 w-full h-[60vh] pointer-events-none z-0">
        <Image
          src="/assets/images/landing.png"
          alt=""
          fill
          className="object-cover object-center"
          style={{
            maskImage: "linear-gradient(to top, transparent 30%, black 100%)",
          }}
          priority
        />
        {/* Gradiente do rodapé até metade da tela */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--background), transparent 55%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Overlay para conteúdo */}
      <div className="relative z-10">
        {/* HEADER */}
        <header className="sticky top-0 z-50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div />

            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              asChild
            >
              {currentStreamer ? (
                <Link href={`/${currentStreamer.twitchUsername}`} prefetch>
                  <LogIn className="h-4 w-4 mr-2" />
                  Acessar Perfil
                </Link>
              ) : (
                <Link href="/auth" prefetch>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              )}
            </Button>
          </div>
        </header>

        {/* MAIN */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full relative w-full max-w-xs sm:max-w-none h-24 sm:h-48 mx-auto">
                <Image
                  src="/assets/images/logo.png"
                  alt="Streamline Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Organize e compartilhe a agenda dos seus jogos com sua comunidade
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                {currentStreamer ? (
                  <Link href="/admin" prefetch>
                    <LogIn className="h-5 w-5 mr-2" />
                    Começar Agora
                  </Link>
                ) : (
                  <Link href="/auth" prefetch>
                    <LogIn className="h-5 w-5 mr-2" />
                    Começar Agora
                  </Link>
                )}
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/fantonlord" prefetch>
                  <Calendar className="h-5 w-5 mr-2" />
                  Ver Exemplo
                </Link>
              </Button>
            </div>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: <Calendar className="h-5 w-5 text-primary" />,
                title: "Organize",
                desc: "Planeje sua agenda de jogos diária, semanal ou mensal de forma simples e visual",
              },
              {
                icon: <Twitch className="h-5 w-5 text-primary" />,
                title: "Compartilhe",
                desc: "Tenha um link único com seu nome da Twitch para compartilhar com sua comunidade",
              },
              {
                icon: <LogIn className="h-5 w-5 text-primary" />,
                title: "Gerencie",
                desc: "Adicione, edite e remova jogos da sua agenda de forma rápida pelo painel do streamer",
              },
            ].map(({ icon, title, desc }) => (
              <Card
                key={title}
                className="border-primary/20 bg-background/80 backdrop-blur-md"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
