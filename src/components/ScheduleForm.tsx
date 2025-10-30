"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GameSearch } from "./GameSearch";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Game {
  id: number;
  name: string;
  cover?: { url: string };
  summary?: string;
}

interface Link {
  url: string;
  name: string;
}

interface ScheduleFormProps {
  streamerId: string;
  onSuccess: () => void;
}

export const ScheduleForm = ({ streamerId, onSuccess }: ScheduleFormProps) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCustomGame, setIsCustomGame] = useState(false);
  const [customGameTitle, setCustomGameTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("");
  const [links, setLinks] = useState<Link[]>([{ url: "", name: "" }]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setIsCustomGame(false);
    setCustomGameTitle("");
  };

  const handleAddLink = () => {
    setLinks([...links, { url: "", name: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (
    index: number,
    field: "url" | "name",
    value: string
  ) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar seleção de jogo ou nome customizado
      if (!isCustomGame && !selectedGame) {
        alert(
          "Por favor, selecione um jogo ou informe o nome do jogo customizado"
        );
        setIsSubmitting(false);
        return;
      }

      // Criar stream agendada
      const validLinks = links.filter((link) => link.url.trim());
      await fetch("/api/scheduled-streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: null, // não persistimos jogos
          igdbGameId: !isCustomGame && selectedGame ? selectedGame.id : null,
          gameTitle: isCustomGame ? customGameTitle : selectedGame?.name,
          gameImage:
            !isCustomGame && selectedGame?.cover?.url
              ? `https:${selectedGame.cover.url}`
              : undefined,
          gameSynopsis: !isCustomGame ? selectedGame?.summary : undefined,
          scheduledDate: `${scheduledDate}T${scheduledTime}:00`,
          scheduledTime,
          duration,
          links: validLinks.length > 0 ? validLinks : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      // Limpar formulário
      setSelectedGame(null);
      setCustomGameTitle("");
      setIsCustomGame(false);
      setScheduledDate("");
      setScheduledTime("");
      setDuration("");
      setLinks([{ url: "", name: "" }]);
      setNotes("");

      onSuccess();
    } catch (error) {
      console.error("Error submitting schedule:", error);
      alert("Erro ao agendar stream. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Busca de Jogo */}
      <div className="space-y-2">
        <Label>Jogo</Label>
        {!isCustomGame ? (
          <>
            <GameSearch onGameSelect={handleGameSelect} />
            {selectedGame && (
              <Card className="mt-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        selectedGame.cover?.url
                          ? `https:${selectedGame.cover.url}`
                          : "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80"
                      }
                      alt={selectedGame.name}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div>
                      <p className="font-semibold">{selectedGame.name}</p>
                      {selectedGame.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                          {selectedGame.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedGame(null);
                      setIsCustomGame(true);
                    }}
                  >
                    Usar nome customizado
                  </Button>
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            <Input
              placeholder="Nome do jogo"
              value={customGameTitle}
              onChange={(e) => setCustomGameTitle(e.target.value)}
              required={isCustomGame}
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => {
                setIsCustomGame(false);
                setCustomGameTitle("");
              }}
            >
              Ou buscar na IGDB
            </Button>
          </>
        )}
      </div>

      {/* Data e Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data da Stream</Label>
          <Input
            id="date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input
            id="time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duração</Label>
        <Input
          id="duration"
          placeholder="Ex: 3 horas"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      {/* Links (opcional) */}
      <div className="space-y-2">
        <Label>Links (Twitch de outros streamers, etc.)</Label>
        {links.map((link, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="url"
              placeholder="URL"
              value={link.url}
              onChange={(e) => handleLinkChange(index, "url", e.target.value)}
            />
            <Input
              type="text"
              placeholder="Nome (opcional)"
              value={link.name}
              onChange={(e) => handleLinkChange(index, "name", e.target.value)}
            />
            {links.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveLink(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLink}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Link
        </Button>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Adicione observações sobre a stream (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Agendando..." : "Agendar Stream"}
      </Button>
    </form>
  );
};
