"use client";

import { ExternalLink, Calendar, Clock, Users, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { useEnhancedGameModal } from "./enhanced-game-modal.hook";

interface EnhancedGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
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
      igdbId?: number;
    } | null;
  } | null;
}

export function EnhancedGameModal({
  open,
  onOpenChange,
  onEdit,
  streamData,
}: EnhancedGameModalProps) {
  const { storeLinks } = useEnhancedGameModal(open, streamData);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="streamline-scrollbar max-h-[90vh] max-w-2xl overflow-y-auto border-primary/20 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {image && (
            <div className="relative h-64 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
          )}

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

          {genre && genre.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genre.map((genreName) => (
                <Badge
                  key={genreName}
                  variant="secondary"
                  className="bg-secondary/50"
                >
                  {genreName}
                </Badge>
              ))}
            </div>
          )}

          {streamData.links && streamData.links.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
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
                    className="flex items-center gap-2 border border-border p-2 transition-colors hover:border-primary/50"
                  >
                    <ExternalLink className="h-4 w-4 text-accent" />
                    <span className="text-sm">{link.name || link.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {synopsis && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Sinopse
              </h3>
              <DialogDescription className="leading-relaxed text-muted-foreground">
                {synopsis}
              </DialogDescription>
            </div>
          )}

          {streamData.notes && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Observações
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {streamData.notes}
              </p>
            </div>
          )}

          {storeLinks.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                Onde Comprar
              </h3>
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
            </div>
          )}

          {onEdit ? (
            <div className="flex justify-end border-t border-outline-variant/25 pt-4">
              <Button type="button" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar agenda
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
