"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Calendar, Clock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamData: {
    id: string;
    scheduledDate: Date;
    scheduledTime: string;
    duration: string;
    links?: Array<{ url: string; name?: string }>;
    notes?: string;
    igdbGameId?: number | null;
    gameTitle?: string | null;
    gameImage?: string | null;
    gameSynopsis?: string | null;
    game?: {
      title: string;
      image?: string;
      synopsis?: string;
      genre?: string[];
      platform?: string;
      storeLinks?: Array<{ name: string; url: string }>;
    } | null;
  } | null;
}

export const EnhancedGameModal = ({
  open,
  onOpenChange,
  streamData,
}: GameModalProps) => {
  if (!streamData) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const title = streamData.game?.title || streamData.gameTitle || "Jogo";
  const image = streamData.game?.image || streamData.gameImage || undefined;
  const synopsis =
    streamData.game?.synopsis || streamData.gameSynopsis || undefined;
  const platform = streamData.game?.platform || undefined;
  const genre = streamData.game?.genre || undefined;
  const [storeLinks, setStoreLinks] = useState<Array<{ name: string; url: string }>>(
    streamData.game?.storeLinks || []
  );

  useEffect(() => {
    setStoreLinks(streamData.game?.storeLinks || []);
  }, [streamData]);

  useEffect(() => {
    let aborted = false;
    const loadDetails = async () => {
      if (!open) return;
      const igdbId =
        (streamData as any)?.igdbGameId ||
        (streamData as any)?.igdb_game_id ||
        (streamData?.game as any)?.igdbId;
      let finalId = igdbId;
      if (!finalId) {
        // Fallback: buscar por título no endpoint de busca
        const title = streamData?.game?.title || streamData?.gameTitle;
        if (!title) return;
        try {
          const resSearch = await fetch(`/api/igdb/search?q=${encodeURIComponent(title)}&limit=1`);
          if (resSearch.ok) {
            const dataSearch = await resSearch.json();
            const first = Array.isArray(dataSearch?.results) ? dataSearch.results[0] : null;
            if (first?.id) {
              finalId = first.id;
            }
          }
        } catch {}
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
      } catch (e) {
        // silencioso
      }
    };
    loadDetails();
    return () => {
      aborted = true;
    };
  }, [open, streamData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem do Jogo */}
          {image && (
            <div className="relative h-64  overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
          )}

          {/* Informações da Stream */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Data</p>
                <p>{formatDate(streamData.scheduledDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Horário</p>
                <p>{streamData.scheduledTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Duração</p>
                <p>{streamData.duration}</p>
              </div>
            </div>
            {platform && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Plataforma</p>
                  <p>{platform}</p>
                </div>
              </div>
            )}
          </div>

          {/* Gêneros */}
          {genre && genre.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genre.map((g) => (
                <Badge key={g} variant="secondary" className="bg-secondary/50">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {/* Links de Co-Streamers */}
          {streamData.links && streamData.links.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Streamers Convidados / Links Relacionados
              </h3>
              <div className="space-y-2">
                {streamData.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2  border border-border hover:border-primary/50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-accent" />
                    <span className="text-sm">{link.name || link.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sinopse */}
          {synopsis && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Sinopse
              </h3>
              <DialogDescription className="text-muted-foreground leading-relaxed">
                {synopsis}
              </DialogDescription>
            </div>
          )}

          {/* Observações */}
          {streamData.notes && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Observações
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {streamData.notes}
              </p>
            </div>
          )}

          {/* Links de Venda / Oficiais */}
          {storeLinks && storeLinks.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground">
                Onde Comprar
              </h3>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
