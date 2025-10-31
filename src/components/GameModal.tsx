"use client";

import { memo, useEffect, useState } from "react";
import { ExternalLink, ShoppingCart, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/types";
import Image from "next/image";

interface GameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game | null;
}

export const GameModal = memo(
  ({ open, onOpenChange, game }: GameModalProps) => {
    if (!game) return null;

    const [storeLinks, setStoreLinks] = useState<Array<{ name: string; url: string }>>(game.storeLinks || []);
    const [loadingLinks, setLoadingLinks] = useState(false);

    useEffect(() => {
      setStoreLinks(game.storeLinks || []);
    }, [game]);

    useEffect(() => {
      if (!open || !game) return;
      let aborted = false;
      const loadDetails = async () => {
        if (storeLinks && storeLinks.length > 0) return;
        setLoadingLinks(true);
        let finalId = (game as any)?.igdbId as number | undefined;
        if (!finalId) {
          const title = game?.title;
          if (title) {
            try {
              const resSearch = await fetch(`/api/igdb/search?q=${encodeURIComponent(title)}&limit=1`);
              if (resSearch.ok) {
                const dataSearch = await resSearch.json();
                const first = Array.isArray(dataSearch?.results) ? dataSearch.results[0] : null;
                if (first?.id) finalId = first.id;
              }
            } catch {}
          }
        }
        if (!finalId) return;
        try {
          const res = await fetch(`/api/igdb/games/${finalId}`);
          if (!res.ok) return;
          const data = await res.json();
          const details = data?.game;
          if (!details) return;
          if (!aborted && Array.isArray(details.storeLinks)) {
            setStoreLinks(details.storeLinks);
          }
        } catch {}
        finally {
          if (!aborted) setLoadingLinks(false);
        }
      };
      loadDetails();
      return () => {
        aborted = true;
      };
    }, [open, game, storeLinks?.length]);

    const displayImage = (() => {
      const raw = game.image;
      const fallback = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1280&q=80";
      if (!raw) return undefined;
      const full = raw.startsWith("//") ? `https:${raw}` : raw;
      let url = full.replace("/t_thumb/", "/t_1080p/");
      if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
      return url || fallback;
    })();

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              {game.title}
              {game.platform && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {game.platform}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="relative h-64 overflow-hidden">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={game.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Sem imagem</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>

            {/* Informações da Stream */}
            {((game as any).scheduledTime || (game as any).duration) && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(game as any).scheduledTime && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-accent" />
                    <div>
                      <p className="font-semibold text-foreground">Horário</p>
                      <p>{(game as any).scheduledTime}</p>
                    </div>
                  </div>
                )}
                {(game as any).duration && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-accent" />
                    <div>
                      <p className="font-semibold text-foreground">Duração</p>
                      <p>{(game as any).duration}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {game.genre && game.genre.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.genre.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-secondary/50"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {game.synopsis && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  Sinopse
                </h3>
                <DialogDescription className="text-muted-foreground leading-relaxed">
                  {game.synopsis}
                </DialogDescription>
              </div>
            )}

            {(game as any).notes && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  Observações
                </h3>
                <DialogDescription className="text-muted-foreground leading-relaxed">
                  {(game as any).notes}
                </DialogDescription>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Onde Comprar
              </h3>
              {storeLinks && storeLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {storeLinks.map((link) => (
                    <Button
                      key={link.name}
                      variant="outline"
                      size="sm"
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      {link.name}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loadingLinks ? "Procurando lojas..." : "Nenhum link de loja encontrado"}
                </p>
              )}
            </div>

            {(game as any).streamUrl && (
              <div>
                <hr className="my-4 border-muted-foreground/10" />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  onClick={() =>
                    window.open((game as any).streamUrl as string, "_blank")
                  }
                >
                  Assistir no Twitch
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

GameModal.displayName = "GameModal";
