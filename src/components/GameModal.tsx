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
import { StreamerGameStatusBadge } from "@/components/streamer-profile/StreamerGameStatusBadge";
import { StarRatingDisplay } from "@/components/shared/StarRatingDisplay";
import { formatGameDate } from "@/lib/streamer-game-status";

type GameWithStreamerMeta = Game & {
  streamerGameId?: string;
  status?: string;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
  rating?: number | null;
  notes?: string;
  scheduledTime?: string;
  duration?: string;
  streamUrl?: string;
};

interface GameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: GameWithStreamerMeta | null;
}

function StreamerGameMetaSection({ game }: { game: GameWithStreamerMeta }) {
  if (!game.status) return null;

  const showFinishedMeta =
    game.status === "finished" || game.status === "dropped";

  return (
    <section className="glass-panel space-y-4 rounded-lg border border-outline-variant/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StreamerGameStatusBadge status={game.status} />
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {(game.status === "to_play" || game.status === "playing") && (
          <div>
            <dt className="text-caption font-medium text-muted-foreground">
              {game.status === "to_play"
                ? "Previsão para começar"
                : "Início / previsão"}
            </dt>
            <dd className="text-body-sm font-medium text-foreground">
              {formatGameDate(game.startedAt)}
            </dd>
          </div>
        )}
        {showFinishedMeta && (
          <>
            <div>
              <dt className="text-caption font-medium text-muted-foreground">
                Início / previsão
              </dt>
              <dd className="text-body-sm font-medium text-foreground">
                {formatGameDate(game.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-caption font-medium text-muted-foreground">
                Finalizado em
              </dt>
              <dd className="text-body-sm font-medium text-foreground">
                {formatGameDate(game.finishedAt)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="mb-1 text-caption font-medium text-muted-foreground">
                Nota
              </dt>
              <dd>
                <StarRatingDisplay rating={game.rating} />
              </dd>
            </div>
          </>
        )}
      </dl>
      {game.notes?.trim() ? (
        <div>
          <h3 className="mb-1 text-caption font-medium text-muted-foreground">
            Observações do streamer
          </h3>
          <p className="text-body-sm leading-relaxed text-foreground">
            {game.notes}
          </p>
        </div>
      ) : null}
    </section>
  );
}

export const GameModal = memo(
  ({ open, onOpenChange, game }: GameModalProps) => {
    const [storeLinks, setStoreLinks] = useState<
      Array<{ name: string; url: string }>
    >(game?.storeLinks || []);
    const [loadingLinks, setLoadingLinks] = useState(false);

    useEffect(() => {
      setStoreLinks(game?.storeLinks || []);
    }, [game]);

    useEffect(() => {
      if (!open || !game) return;
      let aborted = false;
      const loadDetails = async () => {
        if (storeLinks && storeLinks.length > 0) return;
        setLoadingLinks(true);
        let finalId = (game as { igdbId?: number }).igdbId;
        if (!finalId) {
          const title = game?.title;
          if (title) {
            try {
              const resSearch = await fetch(
                `/api/igdb/search?q=${encodeURIComponent(title)}&limit=1`
              );
              if (resSearch.ok) {
                const dataSearch = await resSearch.json();
                const first = Array.isArray(dataSearch?.results)
                  ? dataSearch.results[0]
                  : null;
                if (first?.id) finalId = first.id;
              }
            } catch {
              /* ignore */
            }
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
        } catch {
          /* ignore */
        } finally {
          if (!aborted) setLoadingLinks(false);
        }
      };
      loadDetails();
      return () => {
        aborted = true;
      };
    }, [open, game, storeLinks]);

    if (!game) return null;

    const displayImage = (() => {
      const raw = game.image;
      const fallback =
        "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1280&q=80";
      if (!raw) return undefined;
      const full = raw.startsWith("//") ? `https:${raw}` : raw;
      let url = full.replace("/t_thumb/", "/t_1080p/");
      if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
      return url || fallback;
    })();

    const hasSchedule = Boolean(game.scheduledTime || game.duration);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-primary/20 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
              {game.title}
              {game.platform && (
                <Badge className="border-primary/30 bg-primary/20 text-primary">
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
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-muted-foreground">Sem imagem</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>

            {game.status ? <StreamerGameMetaSection game={game} /> : null}

            {hasSchedule && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {game.scheduledTime && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-accent" />
                    <div>
                      <p className="font-semibold text-foreground">Horário</p>
                      <p>{game.scheduledTime}</p>
                    </div>
                  </div>
                )}
                {game.duration && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-accent" />
                    <div>
                      <p className="font-semibold text-foreground">Duração</p>
                      <p>{game.duration}</p>
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
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Sinopse
                </h3>
                <DialogDescription className="leading-relaxed text-muted-foreground">
                  {game.synopsis}
                </DialogDescription>
              </div>
            )}

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
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
                      className="border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      {link.name}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loadingLinks
                    ? "Procurando lojas..."
                    : "Nenhum link de loja encontrado"}
                </p>
              )}
            </div>

            {game.streamUrl && (
              <div>
                <hr className="my-4 border-muted-foreground/10" />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                  onClick={() => window.open(game.streamUrl as string, "_blank")}
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
