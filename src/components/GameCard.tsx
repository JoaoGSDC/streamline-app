"use client";

import { memo } from "react";
import { Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Game } from "@/types";
import Image from "next/image";

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export const GameCard = memo(({ game, onClick }: GameCardProps) => {

  const displayImage = game.image
    ? (() => {
        const full = game.image.startsWith("//") ? `https:${game.image}` : game.image;
        let url = full.replace("/t_thumb/", "/t_1080p/");
        if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
        return url;
      })()
    : null;
  return (
    <Card
      className="group relative overflow-hidden cursor-pointer bg-gradient-to-br from-card to-card/80 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(145,70,255,0.3)] hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Sem imagem</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-80" />

        {game.platform && (
          <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs px-2 py-1 rounded-full">
            {game.platform}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
          {game.title}
        </h3>

        {((game as any).scheduledTime || (game as any).duration) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            {(game as any).scheduledTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {(game as any).scheduledTime}
              </span>
            )}
            {(game as any).duration && (
              <span className="inline-flex items-center gap-1">
                • {(game as any).duration}
              </span>
            )}
          </div>
        )}

        {game.genre && game.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {game.genre.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded"
              >
                {genre}
              </span>
            ))}
            {game.genre.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{game.genre.length - 2} mais
              </span>
            )}
          </div>
        )}

        {game.synopsis && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {game.synopsis}
          </p>
        )}

        {/* Store links are intentionally not shown on cards; only in modals */}

        {(game as any).streamUrl && (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              onClick={(e) => {
                e.stopPropagation();
                window.open((game as any).streamUrl as string, "_blank");
              }}
            >
              Assistir no Twitch
            </Button>
          </div>
        )}
      </div>

      <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 pointer-events-none transition-all duration-300" />
    </Card>
  );
});

GameCard.displayName = "GameCard";
