"use client";

import { FeaturedCreatorCard } from "@/components/landing/FeaturedCreatorCard";
import type { FeaturedCreator } from "@/types/landing";
import { cn } from "@/lib/utils";

interface LandingCreatorsSectionProps {
  id: string;
  title: string;
  subtitle: string;
  creators: FeaturedCreator[];
  variant: "partner" | "premium";
  loading?: boolean;
  className?: string;
}

function CreatorSkeleton({ variant }: { variant: "partner" | "premium" }) {
  return (
    <div
      className={cn(
        "landing-creator-card animate-pulse bg-surface-container-low/60",
        variant === "partner"
          ? "landing-creator-card--partner min-h-[240px] md:min-h-[320px]"
          : "landing-creator-card--premium min-h-[200px] md:min-h-[260px]"
      )}
    />
  );
}

export function LandingCreatorsSection({
  id,
  title,
  subtitle,
  creators,
  variant,
  loading = false,
  className,
}: LandingCreatorsSectionProps) {
  const isPartner = variant === "partner";

  return (
    <section
      id={id}
      className={cn(
        "landing-section scroll-mt-24",
        isPartner ? "landing-section--partners" : "landing-section--premium",
        className
      )}
    >
      <div className="container-cinematic">
        <header className="landing-section__header mb-6 md:mb-14">
          <p className="landing-section__eyebrow mb-2">
            {isPartner ? "Creators oficiais" : "Comunidade premium"}
          </p>
          <h2 className="landing-section__title font-headline text-foreground">
            {title}
          </h2>
          <p className="landing-section__subtitle mt-2 max-w-2xl text-muted-foreground md:mt-3">
            {subtitle}
          </p>
        </header>

        {loading ? (
          <div
            className={cn(
              "grid gap-4 md:gap-5",
              isPartner
                ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {Array.from({ length: isPartner ? 3 : 4 }).map((_, i) => (
              <CreatorSkeleton key={i} variant={variant} />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="glass-panel rounded-lg border border-outline-variant/30 p-6 text-center md:p-10">
            <p className="text-body-md text-muted-foreground">
              {isPartner
                ? "Novos parceiros em breve. Fique de olho nesta vitrine."
                : "Nenhum criador premium no momento."}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4 md:gap-5",
              isPartner
                ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {creators.map((creator) => (
              <FeaturedCreatorCard
                key={creator.id}
                creator={creator}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
