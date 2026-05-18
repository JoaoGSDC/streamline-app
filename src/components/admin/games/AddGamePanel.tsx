"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameSearch } from "@/components/GameSearch";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import type { AdminChannel } from "@/components/admin/AdminProvider";
import { Label } from "@/components/ui/label";
import { STATUS_OPTIONS, type KanbanStatus, statusLabel } from "./kanban-config";
import { toDateInputValue } from "@/lib/streamer-game-status";

export interface AddGameMeta {
  startedAt?: string;
}

interface AddGamePanelProps {
  onAddFromIGDB: (
    game: {
      id: number;
      name: string;
      cover?: { url: string };
      summary?: string;
    },
    status: KanbanStatus,
    meta?: AddGameMeta
  ) => Promise<void>;
  onAddCustom: (
    title: string,
    image: string | undefined,
    status: KanbanStatus,
    meta?: AddGameMeta
  ) => Promise<void>;
  formTarget: string;
  onFormTargetChange: (id: string) => void;
  ownerChannel: AdminChannel | null;
  moderatedChannels: AdminChannel[];
}

export function AddGamePanel({
  onAddFromIGDB,
  onAddCustom,
  formTarget,
  onFormTargetChange,
  ownerChannel,
  moderatedChannels,
}: AddGamePanelProps) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<KanbanStatus>("to_play");
  const [plannedStart, setPlannedStart] = useState(() =>
    toDateInputValue(new Date())
  );

  return (
    <AdminSection
      title="Adicionar jogo"
      description="Busque no IGDB ou cadastre manualmente. Novos jogos entram na coluna escolhida."
    >
      <div className="space-y-6">
        <AdminStreamerFormSelect
          value={formTarget}
          onChange={onFormTargetChange}
          ownerChannel={ownerChannel}
          moderatedChannels={moderatedChannels}
          alwaysShow
          label="Streamer"
          disabledHint="Você não modera outros canais. O jogo será cadastrado no seu perfil."
          enabledHint="Escolha em qual canal este jogo será cadastrado."
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-body-sm font-medium text-foreground">
              <Search className="h-4 w-4 text-primary" />
              Buscar no IGDB
            </div>
            <GameSearch
              onGameSelect={async (g) => {
                await onAddFromIGDB(
                  g as Parameters<AddGamePanelProps["onAddFromIGDB"]>[0],
                  "to_play",
                  { startedAt: plannedStart }
                );
              }}
            />
            <div className="space-y-1">
              <Label className="text-caption text-muted-foreground">
                Previsão para começar
              </Label>
              <Input
                type="date"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className="input-cinematic"
              />
            </div>
            <p className="text-caption text-muted-foreground">
              Adiciona automaticamente em &quot;Para jogar&quot; no canal selecionado acima.
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!title.trim()) return;
              await onAddCustom(title.trim(), image.trim() || undefined, status, {
                startedAt:
                  status === "to_play" || status === "playing"
                    ? plannedStart
                    : undefined,
              });
              setTitle("");
              setImage("");
              setStatus("to_play");
              setPlannedStart(toDateInputValue(new Date()));
            }}
          >
            <div className="flex items-center gap-2 text-body-sm font-medium text-foreground">
              <Plus className="h-4 w-4 text-secondary" />
              Cadastro manual
            </div>
            <Input
              placeholder="Título do jogo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-cinematic"
            />
            <Input
              placeholder="URL da capa (opcional)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="input-cinematic"
            />
            {(status === "to_play" || status === "playing") && (
              <div className="space-y-1">
                <Label className="text-caption text-muted-foreground">
                  Previsão para começar
                </Label>
                <Input
                  type="date"
                  value={plannedStart}
                  onChange={(e) => setPlannedStart(e.target.value)}
                  className="input-cinematic"
                />
              </div>
            )}
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as KanbanStatus)}
            >
              <SelectTrigger className="input-cinematic">
                <SelectValue placeholder="Coluna inicial" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full sm:w-auto">
              Adicionar em {statusLabel(status)}
            </Button>
          </form>
        </div>
      </div>
    </AdminSection>
  );
}
