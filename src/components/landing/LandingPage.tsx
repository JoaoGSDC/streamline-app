"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { BRAND_NAME } from "@/components/BrandLogo";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCreatorsSection } from "@/components/landing/LandingCreatorsSection";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingCta } from "@/components/landing/LandingCta";
import { useFeaturedStreamers } from "@/hooks/useFeaturedStreamers";

function getCurrentStreamer() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentStreamer");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function LandingPage() {
  const [currentStreamer, setCurrentStreamer] = useState<{
    twitchUsername: string;
  } | null>(null);
  const { partners, premium, loading } = useFeaturedStreamers();

  useEffect(() => {
    setCurrentStreamer(getCurrentStreamer());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentStreamer") {
        setCurrentStreamer(getCurrentStreamer());
      }
    };
    const onFocus = () => setCurrentStreamer(getCurrentStreamer());

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const exampleSlug =
    partners[0]?.twitchUsername ?? premium[0]?.twitchUsername ?? "fantonlord";

  return (
    <div className="landing-page relative min-h-screen bg-background">
      <Header
        showBrandLogo
        trailing={
          <Button size="sm" variant="nav-login" asChild>
            {currentStreamer ? (
              <Link href={`/${currentStreamer.twitchUsername}`} prefetch>
                <LogIn className="h-4 w-4 shrink-0 sm:mr-2" />
                <span className="hidden sm:inline">Acessar perfil</span>
                <span className="sm:hidden">Perfil</span>
              </Link>
            ) : (
              <Link href="/auth" prefetch>
                <LogIn className="h-4 w-4 shrink-0 sm:mr-2" />
                Login
              </Link>
            )}
          </Button>
        }
      />

      <LandingHero
        currentStreamer={currentStreamer}
        exampleSlug={exampleSlug}
      />

      <LandingCreatorsSection
        id="parceiros"
        title="Streamers parceiros"
        subtitle={`Creators oficiais da plataforma — vitrine premium, máximo destaque e presença de marca ${BRAND_NAME}.`}
        creators={partners}
        variant="partner"
        loading={loading}
      />

      <LandingCreatorsSection
        id="premium"
        title="Streamers premium"
        subtitle="Assinantes que elevam sua presença na comunidade — destaque elegante, abaixo dos parceiros oficiais."
        creators={premium}
        variant="premium"
        loading={loading}
        className="pb-8"
      />

      <LandingFeatures />

      <LandingCta currentStreamer={currentStreamer} />

      <footer className="border-t border-outline-variant/30 py-8">
        <div className="container-cinematic flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} {BRAND_NAME} — hub premium para streamers
          </p>
          <Link
            href="/auth"
            className="text-body-sm text-primary hover:text-secondary-container"
          >
            Área do streamer
          </Link>
        </div>
      </footer>
    </div>
  );
}
