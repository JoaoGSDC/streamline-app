"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRatingInput } from "@/components/shared/StarRatingInput";
import {
  STATUS_OPTIONS,
  type KanbanStatus,
} from "./kanban-config";
import {
  toDateInputValue,
  type StreamerGameStatus,
} from "@/lib/streamer-game-status";
import type { KanbanGameItem, KanbanGameMetaPatch } from "./KanbanCard";

interface KanbanGameEditDrawerProps {
  open: boolean;
  item: KanbanGameItem | null;
  saving?: boolean;
  normalizeImageUrl: (raw?: string | null) => string;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: KanbanGameMetaPatch) => void;
  onRemove: (id: string) => void;
}

export function KanbanGameEditDrawer({
  open,
  item,
  saving = false,
  normalizeImageUrl,
  onOpenChange,
  onSave,
  onRemove,
}: KanbanGameEditDrawerProps) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<KanbanStatus>("to_play");
  const [startedAt, setStartedAt] = useState("");
  const [finishedAt, setFinishedAt] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!item) return;
    setTitle(item.game?.title || item.customTitle || "");
    setImageUrl(item.customImage || item.game?.image || "");
    setStatus(item.status as KanbanStatus);
    setStartedAt(toDateInputValue(item.startedAt));
    setFinishedAt(toDateInputValue(item.finishedAt));
    setRating(item.rating != null ? Number(item.rating) : null);
    setNotes(item.notes || "");
  }, [item]);

  if (!item) return null;

  const isFinished = status === "finished" || status === "dropped";
  const isLinkedGame = Boolean(item.gameId && item.game?.title);

  const handleSave = () => {
    onSave(item.id, {
      status: status as StreamerGameStatus,
      customTitle: isLinkedGame ? undefined : title.trim() || null,
      customImage: imageUrl.trim() || null,
      startedAt: startedAt || null,
      finishedAt: isFinished ? finishedAt || null : null,
      rating: isFinished ? rating : null,
      notes: notes.trim(),
    });
    onOpenChange(false);
  };

  const previewImage = normalizeImageUrl(imageUrl || null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[480px] max-w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="border-b border-outline-variant/20 px-6 py-5 text-left">
          <SheetTitle className="text-section-title">Editar jogo</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt=""
            className="mx-auto aspect-[3/4] w-32 rounded-lg object-cover"
          />

          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              readOnly={isLinkedGame}
              disabled={saving || isLinkedGame}
              onChange={(event) => setTitle(event.target.value)}
            />
            {isLinkedGame && (
              <p className="text-caption text-muted-foreground">
                Jogos do IGDB usam o título do catálogo.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-image">URL da capa</Label>
            <Input
              id="edit-image"
              value={imageUrl}
              disabled={saving}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-2">
            <Label>Coluna / status</Label>
            <Select
              value={status}
              disabled={saving}
              onValueChange={(value) => setStatus(value as KanbanStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-started">
                {status === "to_play" ? "Previsão para começar" : "Data de início"}
              </Label>
              <Input
                id="edit-started"
                type="date"
                value={startedAt}
                disabled={saving}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </div>
            {isFinished && (
              <div className="space-y-2">
                <Label htmlFor="edit-finished">Data de finalização</Label>
                <Input
                  id="edit-finished"
                  type="date"
                  value={finishedAt}
                  disabled={saving}
                  onChange={(event) => setFinishedAt(event.target.value)}
                />
              </div>
            )}
          </div>

          {isFinished && (
            <div className="space-y-2">
              <Label>Nota</Label>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              rows={3}
              value={notes}
              disabled={saving}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="mt-auto flex-col gap-3 border-t border-outline-variant/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={saving}
            onClick={() => {
              onRemove(item.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover jogo
          </Button>
          <div className="flex gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={saving} onClick={handleSave}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
