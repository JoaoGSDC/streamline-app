"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelSearch } from "@/components/ChannelSearch";

interface LandingHeroProps {
  currentStreamer: { twitchUsername: string } | null;
  exampleSlug: string;
}

export function LandingHero({ currentStreamer, exampleSlug }: LandingHeroProps) {
  return (
    <section className="landing-hero relative overflow-hidden">
      <div className="landing-hero__bg" aria-hidden>
        <Image
          src="/assets/images/landing.png"
          alt=""
          fill
          className="object-cover object-center opacity-90"
          priority
        />
        <div className="landing-hero__gradient" />
        <div className="landing-hero__grid" />
        <div className="landing-hero__particles" />
      </div>

      <div className="landing-hero__float landing-hero__float--1 hidden md:block" aria-hidden>
        <span className="landing-hero__chip">Agenda ao vivo</span>
      </div>
      <div className="landing-hero__float landing-hero__float--2 hidden md:block" aria-hidden>
        <span className="landing-hero__chip">Board de jogos</span>
      </div>
      <div className="landing-hero__float landing-hero__float--3 hidden md:block" aria-hidden>
        <span className="landing-hero__chip">Comunidade ativa</span>
      </div>

      <div className="landing-hero__content container-cinematic relative z-10">
        <div className="landing-hero__inner mx-auto max-w-4xl text-center">
          <p className="landing-hero__eyebrow mb-4 inline-flex max-w-full items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" aria-hidden />
            <span className="text-center">Plataforma premium para streamers</span>
          </p>

          <h1 className="landing-hero__title mb-4 font-headline md:mb-6">
            Conecte-se ao universo dos{" "}
            <span className="gradient-text-primary">streamers</span>
          </h1>

          <p className="landing-hero__subtitle mx-auto mb-6 max-w-2xl text-body-sm text-muted-foreground md:mb-8 md:text-body-lg lg:text-xl">
            Descubra criadores, organize sua comunidade e viva o streaming com
            agenda, jogos e presença social — tudo em um hub cinematográfico.
          </p>

          <div className="landing-hero__chips-mobile mb-6 flex flex-wrap justify-center gap-2 md:hidden">
            <span className="landing-hero__chip">Agenda</span>
            <span className="landing-hero__chip">Jogos</span>
            <span className="landing-hero__chip">Comunidade</span>
          </div>

          <div className="landing-hero__search mx-auto mb-6 w-full max-w-md md:mb-10">
            <ChannelSearch
              className="w-full"
              placeholder="Buscar streamer..."
            />
          </div>

          <div className="landing-hero__actions mx-auto flex w-full max-w-md flex-col gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Button
              size="lg"
              className="landing-cta-primary h-12 w-full sm:w-auto sm:min-w-[11rem]"
              asChild
            >
              {currentStreamer ? (
                <Link href="/admin">
                  <LogIn className="mr-2 h-5 w-5 shrink-0" />
                  Começar agora
                </Link>
              ) : (
                <Link href="/auth">
                  <LogIn className="mr-2 h-5 w-5 shrink-0" />
                  Começar agora
                </Link>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-primary/30 bg-background/20 backdrop-blur-sm sm:w-auto sm:min-w-[11rem]"
              asChild
            >
              <Link href={`/${exampleSlug}`}>
                <Calendar className="mr-2 h-5 w-5 shrink-0" />
                Ver exemplo
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 w-full text-muted-foreground hover:text-primary sm:w-auto"
              asChild
            >
              <a href="#parceiros" className="inline-flex items-center justify-center">
                <span className="sm:hidden">Explorar</span>
                <span className="hidden sm:inline">Explorar criadores</span>
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
