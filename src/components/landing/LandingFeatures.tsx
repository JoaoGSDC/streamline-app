"use client";

import {
  Calendar,
  Gamepad2,
  LayoutGrid,
  Radio,
  Share2,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Agenda cinematográfica",
    desc: "Planeje streams por dia, semana ou mês. Sua comunidade sempre sabe o que vem a seguir.",
  },
  {
    icon: Gamepad2,
    title: "Board de jogos",
    desc: "Kanban visual com status, notas e datas. Organize sua jornada como um pro player.",
  },
  {
    icon: Radio,
    title: "Descoberta ao vivo",
    desc: "Encontre criadores, veja quem está online e mergulhe no perfil em segundos.",
  },
  {
    icon: Share2,
    title: "Link único",
    desc: "Um URL com sua marca Twitch. Compartilhe em bio, Discord e redes sem fricção.",
  },
  {
    icon: Users,
    title: "Moderação de canal",
    desc: "Mods gerenciam agenda e jogos em nome do streamer, com controle claro de permissões.",
  },
  {
    icon: LayoutGrid,
    title: "Perfil público premium",
    desc: "Capa, jogos, agenda e redes sociais em uma experiência dark, glass e memorável.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="plataforma" className="landing-section scroll-mt-24">
      <div className="container-cinematic">
        <header className="landing-section__header landing-section__header--center mb-8 text-center md:mb-16">
          <p className="landing-section__eyebrow mb-2">Como funciona</p>
          <h2 className="landing-section__title font-headline text-foreground">
            Tudo que um streamer precisa.{" "}
            <span className="gradient-text-primary">Nada que atrapalhe.</span>
          </h2>
          <p className="landing-section__subtitle mx-auto mt-3 max-w-2xl text-muted-foreground">
            Da organização interna à vitrine pública — ferramentas sociais,
            visuais e inteligentes para creators que levam a comunidade a sério.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }, index) => (
            <article
              key={title}
              className="landing-feature-card"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="landing-feature-card__icon">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 font-headline text-body-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-body-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
