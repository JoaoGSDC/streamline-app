"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GameSearch } from "./GameSearch";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import type { AdminChannel } from "@/components/admin/AdminProvider";

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

export interface ScheduleFormEditStream {
  id: string;
  streamerId: string;
  igdbGameId?: number | null;
  gameTitle?: string | null;
  gameImage?: string | null;
  gameSynopsis?: string | null;
  scheduledDate: Date | string;
  scheduledTime: string;
  duration: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string | null;
}

interface ScheduleFormProps {
  formTarget: string;
  onFormTargetChange: (id: string) => void;
  ownerChannel: AdminChannel | null;
  moderatedChannels: AdminChannel[];
  resolveStreamerId: (formTarget: string) => string;
  editingStream?: ScheduleFormEditStream | null;
  onCancelEdit?: () => void;
  onSuccess: () => void;
}

function formatDateForInput(value: Date | string): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function coverUrlFromStored(image?: string | null): string | undefined {
  if (!image?.trim()) return undefined;
  if (image.startsWith("//")) return image;
  if (image.startsWith("http")) {
    try {
      const u = new URL(image);
      return u.pathname + u.search;
    } catch {
      return image;
    }
  }
  return image.startsWith("/") ? image : `//${image.replace(/^\/+/, "")}`;
}

function resetFormState(setters: {
  setSelectedGame: (g: Game | null) => void;
  setIsCustomGame: (v: boolean) => void;
  setCustomGameTitle: (v: string) => void;
  setScheduledDate: (v: string) => void;
  setScheduledTime: (v: string) => void;
  setDuration: (v: string) => void;
  setLinks: (v: Link[]) => void;
  setNotes: (v: string) => void;
}) {
  setters.setSelectedGame(null);
  setters.setIsCustomGame(false);
  setters.setCustomGameTitle("");
  setters.setScheduledDate("");
  setters.setScheduledTime("");
  setters.setDuration("");
  setters.setLinks([{ url: "", name: "" }]);
  setters.setNotes("");
}

export const ScheduleForm = ({
  formTarget,
  onFormTargetChange,
  ownerChannel,
  moderatedChannels,
  resolveStreamerId,
  editingStream,
  onCancelEdit,
  onSuccess,
}: ScheduleFormProps) => {
  const isEditing = Boolean(editingStream?.id);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCustomGame, setIsCustomGame] = useState(false);
  const [customGameTitle, setCustomGameTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("");
  const [links, setLinks] = useState<Link[]>([{ url: "", name: "" }]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingStream) {
      resetFormState({
        setSelectedGame,
        setIsCustomGame,
        setCustomGameTitle,
        setScheduledDate,
        setScheduledTime,
        setDuration,
        setLinks,
        setNotes,
      });
      return;
    }

    if (editingStream.streamerId) {
      onFormTargetChange(editingStream.streamerId);
    }

    if (editingStream.igdbGameId) {
      setSelectedGame({
        id: editingStream.igdbGameId,
        name: editingStream.gameTitle || "Jogo",
        cover: editingStream.gameImage
          ? { url: coverUrlFromStored(editingStream.gameImage) || "" }
          : undefined,
        summary: editingStream.gameSynopsis || undefined,
      });
      setIsCustomGame(false);
      setCustomGameTitle("");
    } else if (editingStream.gameTitle) {
      setSelectedGame(null);
      setIsCustomGame(true);
      setCustomGameTitle(editingStream.gameTitle);
    } else {
      setSelectedGame(null);
      setIsCustomGame(false);
      setCustomGameTitle("");
    }

    setScheduledDate(formatDateForInput(editingStream.scheduledDate));
    setScheduledTime(editingStream.scheduledTime);
    setDuration(editingStream.duration || "");
    setLinks(
      editingStream.links?.length
        ? editingStream.links.map((l) => ({
            url: l.url,
            name: l.name || "",
          }))
        : [{ url: "", name: "" }]
    );
    setNotes(editingStream.notes || "");
  }, [editingStream, onFormTargetChange]);

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
      if (!isCustomGame && !selectedGame) {
        alert(
          "Por favor, selecione um jogo ou informe o nome do jogo customizado"
        );
        setIsSubmitting(false);
        return;
      }

      const validLinks = links.filter((link) => link.url.trim());
      const streamerId = resolveStreamerId(formTarget);

      let gameImage: string | null = null;
      if (!isCustomGame && selectedGame?.cover?.url) {
        gameImage = `https:${selectedGame.cover.url}`;
      } else if (isEditing && editingStream?.gameImage) {
        gameImage = editingStream.gameImage;
      }

      const payload = {
        streamerId,
        gameId: null as string | null,
        igdbGameId: !isCustomGame && selectedGame ? selectedGame.id : null,
        gameTitle: isCustomGame ? customGameTitle : selectedGame?.name,
        gameImage,
        gameSynopsis: !isCustomGame
          ? selectedGame?.summary ?? editingStream?.gameSynopsis ?? null
          : null,
        scheduledDate: `${scheduledDate}T${scheduledTime}:00`,
        scheduledTime,
        duration,
        links: validLinks.length > 0 ? validLinks : [],
        notes: notes.trim() || null,
      };

      const res = isEditing
        ? await fetch(`/api/scheduled-streams/${editingStream!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/scheduled-streams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar");
      }

      if (!isEditing) {
        resetFormState({
          setSelectedGame,
          setIsCustomGame,
          setCustomGameTitle,
          setScheduledDate,
          setScheduledTime,
          setDuration,
          setLinks,
          setNotes,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error submitting schedule:", error);
      alert(
        isEditing
          ? "Erro ao atualizar a agenda. Tente novamente."
          : "Erro ao agendar stream. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminStreamerFormSelect
        value={formTarget}
        onChange={onFormTargetChange}
        ownerChannel={ownerChannel}
        moderatedChannels={moderatedChannels}
        alwaysShow
        label="Streamer"
        disabledHint="Você não modera outros canais. A agenda será registrada no seu perfil."
        enabledHint="Escolha em qual canal esta agenda será registrada."
      />

      <div className="space-y-2">
        <Label>Jogo</Label>
        {!isCustomGame ? (
          <>
            <GameSearch onGameSelect={handleGameSelect} />
            {selectedGame && (
              <Card className="mt-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        selectedGame.cover?.url
                          ? `https:${selectedGame.cover.url}`
                          : "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80"
                      }
                      alt={selectedGame.name}
                      className="h-20 w-16 rounded object-cover"
                    />
                    <div>
                      <p className="font-semibold">{selectedGame.name}</p>
                      {selectedGame.summary && (
                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
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
              className="input-cinematic"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data da Stream</Label>
          <Input
            id="date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="input-cinematic"
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
            className="input-cinematic"
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
          className="input-cinematic"
        />
      </div>

      <div className="space-y-2">
        <Label>Links (Twitch de outros streamers, etc.)</Label>
        {links.map((link, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="url"
              placeholder="URL"
              value={link.url}
              onChange={(e) => handleLinkChange(index, "url", e.target.value)}
              className="input-cinematic"
            />
            <Input
              type="text"
              placeholder="Nome (opcional)"
              value={link.name}
              onChange={(e) => handleLinkChange(index, "name", e.target.value)}
              className="input-cinematic"
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
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Link
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Adicione observações sobre a stream (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input-cinematic"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {isEditing && onCancelEdit ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancelEdit}
            disabled={isSubmitting}
          >
            Cancelar edição
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={isEditing && onCancelEdit ? "flex-1" : "w-full"}
        >
          {isSubmitting
            ? isEditing
              ? "Salvando..."
              : "Agendando..."
            : isEditing
              ? "Salvar alterações"
              : "Agendar Stream"}
        </Button>
      </div>
    </form>
  );
};
