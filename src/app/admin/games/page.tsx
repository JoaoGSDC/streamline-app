"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminChannelOptions } from "@/hooks/useAdminChannelOptions";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { AddGamePanel } from "@/components/admin/games/AddGamePanel";
import { KanbanBoard } from "@/components/admin/games/KanbanBoard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KANBAN_COLUMNS } from "@/components/admin/games/kanban-config";
import { useAdminGamesBoard } from "@features/games/hooks/use-admin-games-board.hook";

function normalizeImageUrl(raw?: string | null) {
  if (!raw) {
    return "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
  }
  const full = raw.startsWith("//") ? `https:${raw}` : raw;
  let url = full.replace("/t_thumb/", "/t_720p/");
  if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
  return url;
}

export default function AdminGames() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    resolveFormStreamerId,
    channels,
  } = useAdminChannelOptions();

  const channelKey = useMemo(
    () => channels.map((channel) => channel.id).sort().join(","),
    [channels]
  );

  const [formTarget, setFormTarget] = useState("");
  const [boardTarget, setBoardTarget] = useState("");

  const boardStreamerId = useMemo(
    () => resolveFormStreamerId(boardTarget),
    [boardTarget, resolveFormStreamerId]
  );

  const {
    loading,
    boardYear,
    boardFinishedYears,
    columns,
    setBoardYear,
    handleDropAt,
    saveGameMeta,
    addFromIgdb,
    addCustom,
    remove,
  } = useAdminGamesBoard({
    boardStreamerId,
    channelKey,
    onLoadError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os jogos.",
        variant: "destructive",
      });
    },
    onToast: (payload) => toast(payload),
  });

  if (!ownerChannel && channels.length === 0) return null;

  return (
    <>
      <AdminPageHeader
        title="Gerenciar Jogos"
        description="Organize sua biblioteca em um board fluido. Arraste entre colunas para atualizar o status."
      />

      <div className="space-y-8">
        <AddGamePanel
          onAddFromIGDB={(selectedGame, status, meta) =>
            addFromIgdb(
              selectedGame,
              status,
              resolveFormStreamerId(formTarget),
              meta
            )
          }
          onAddCustom={(title, image, status, meta) =>
            addCustom(
              title,
              image,
              status,
              resolveFormStreamerId(formTarget),
              meta
            )
          }
          formTarget={formTarget}
          onFormTargetChange={setFormTarget}
          ownerChannel={ownerChannel}
          moderatedChannels={moderatedChannels}
        />

        <AdminSection
          title="Board de jogos"
          description="Arraste cards para reordenar ou mudar de coluna. A coluna alvo recebe destaque roxo."
          contentClassName="overflow-visible p-4 sm:p-5"
        >
          <div className="mb-4 space-y-4">
            <AdminStreamerFormSelect
              value={boardTarget}
              onChange={setBoardTarget}
              ownerChannel={ownerChannel}
              moderatedChannels={moderatedChannels}
              alwaysShow
              label="Streamer"
              disabledHint="Você não modera outros canais. Exibindo o board do seu perfil."
              enabledHint="Escolha de qual canal exibir o board de jogos."
              className="max-w-md"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={boardYear} onValueChange={setBoardYear}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Filtrar por ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {boardFinishedYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      Zerados em {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-caption text-muted-foreground">
                Filtra Concluídos e Droppados por ano de finalização. Demais
                colunas permanecem visíveis.
              </p>
            </div>
          </div>
          {loading ? (
            <div className="admin-kanban-board">
              {KANBAN_COLUMNS.map((column) => (
                <div
                  key={column.key}
                  className="admin-kanban-column h-[320px] animate-pulse bg-surface-container-low/40"
                />
              ))}
            </div>
          ) : (
            <KanbanBoard
              columns={columns}
              onDropAt={handleDropAt}
              onRemove={remove}
              onSaveMeta={saveGameMeta}
              normalizeImageUrl={normalizeImageUrl}
              showStreamerBadge={false}
              streamerLabels={{}}
            />
          )}
        </AdminSection>
      </div>
    </>
  );
}
