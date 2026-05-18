"use client";

import Link from "next/link";
import { LogIn, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingCtaProps {
  currentStreamer: { twitchUsername: string } | null;
}

export function LandingCta({ currentStreamer }: LandingCtaProps) {
  return (
    <section className="landing-section landing-cta">
      <div className="container-cinematic">
        <div className="landing-cta__panel">
          <div className="landing-cta__glow" aria-hidden />
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <p className="landing-section__eyebrow mb-3 inline-flex items-center gap-2">
              <Zap className="h-4 w-4" aria-hidden />
              Entre na arena
            </p>
            <h2 className="landing-section__title mb-3 font-headline text-foreground md:mb-4">
              Sua comunidade merece uma vitrine à altura do seu conteúdo
            </h2>
            <p className="mb-6 text-body-sm text-muted-foreground md:mb-8 md:text-body-md">
              Crie sua agenda, monte seu board de jogos e compartilhe um perfil
              que transmite profissionalismo desde o primeiro clique.
            </p>
            <Button size="lg" className="landing-cta-primary h-12 w-full max-w-sm sm:min-w-[220px]" asChild>
              {currentStreamer ? (
                <Link href="/admin">
                  <LogIn className="mr-2 h-5 w-5" />
                  Ir para o painel
                </Link>
              ) : (
                <Link href="/auth">
                  <LogIn className="mr-2 h-5 w-5" />
                  Criar minha conta
                </Link>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
