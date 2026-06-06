"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminChannelOptions } from "@/hooks/useAdminChannelOptions";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { AddGameModal } from "@/components/admin/games/AddGameModal";
import { KanbanBoard } from "@/components/admin/games/KanbanBoard";
import {
  KanbanGameEditDrawer,
} from "@/components/admin/games/KanbanGameEditDrawer";
import type { KanbanGameItem } from "@/components/admin/games/KanbanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KANBAN_COLUMNS,
  type KanbanColumnKey,
  type KanbanStatus,
} from "@/components/admin/games/kanban-config";
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

function matchesTitleSearch(item: KanbanGameItem, query: string) {
  if (!query) return true;
  const title = (item.game?.title || item.customTitle || "").toLowerCase();
  return title.includes(query);
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

  const [boardTarget, setBoardTarget] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalInitialStatus, setAddModalInitialStatus] =
    useState<KanbanStatus>("to_play");
  const [editItem, setEditItem] = useState<KanbanGameItem | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [showDropped, setShowDropped] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const visibleColumnKeys = useMemo<KanbanColumnKey[]>(
    () =>
      KANBAN_COLUMNS.filter(
        (column) => showDropped || column.key !== "dropped"
      ).map((column) => column.key),
    [showDropped]
  );

  const titleQuery = titleSearch.trim().toLowerCase();

  const filteredColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        items: column.items.filter((item) =>
          matchesTitleSearch(item, titleQuery)
        ),
      })),
    [columns, titleQuery]
  );

  const openAddModal = (status: KanbanStatus = "to_play") => {
    setAddModalInitialStatus(status);
    setAddModalOpen(true);
  };

  const handleEdit = (item: KanbanGameItem) => {
    setEditItem(item);
    setEditDrawerOpen(true);
  };

  const handleSaveMeta = async (
    id: string,
    patch: Parameters<typeof saveGameMeta>[1]
  ) => {
    setSubmitting(true);
    try {
      await saveGameMeta(id, patch);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setSubmitting(true);
    try {
      await remove(id);
      if (editItem?.id === id) {
        setEditDrawerOpen(false);
        setEditItem(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ownerChannel && channels.length === 0) return null;

  return (
    <>
      <AdminPageHeader
        title="Gerenciar Jogos"
        description="Organize sua biblioteca em um board fluido. Arraste entre colunas para atualizar o status."
      >
        <Button type="button" onClick={() => openAddModal("to_play")}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar jogo
        </Button>
      </AdminPageHeader>

      <AdminSection
        title="Board de jogos"
        description="Arraste cards para reordenar ou mudar de coluna. A coluna alvo recebe destaque roxo."
        contentClassName="overflow-visible p-4 sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <AdminStreamerFormSelect
            value={boardTarget}
            onChange={setBoardTarget}
            ownerChannel={ownerChannel}
            moderatedChannels={moderatedChannels}
            alwaysShow
            label="Streamer"
            disabledHint="Você não modera outros canais. Exibindo o board do seu perfil."
            enabledHint="Escolha de qual canal exibir o board de jogos."
            className="w-full max-w-md"
          />

          <div className="flex w-full max-w-md flex-col gap-1.5">
            <label
              htmlFor="board-year-filter"
              className="text-label font-medium text-foreground"
            >
              Concluídos/Droppados por ano
            </label>
            <Select value={boardYear} onValueChange={setBoardYear}>
              <SelectTrigger id="board-year-filter" className="w-full">
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
          </div>

          <div className="flex w-full max-w-md flex-col gap-1.5">
            <label
              htmlFor="board-title-search"
              className="text-label font-medium text-foreground"
            >
              Buscar por título
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="board-title-search"
                value={titleSearch}
                onChange={(event) => setTitleSearch(event.target.value)}
                placeholder="Filtrar cards visíveis…"
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:mb-0.5"
            onClick={() => setShowDropped((value) => !value)}
          >
            {showDropped ? "Ocultar Droppados" : "Mostrar Droppados"}
          </Button>
        </div>

        {loading ? (
          <div className="admin-kanban-board">
            {visibleColumnKeys.map((columnKey) => (
              <div
                key={columnKey}
                className="admin-kanban-column h-[320px] animate-pulse bg-surface-container-low/40"
              />
            ))}
          </div>
        ) : (
          <KanbanBoard
            columns={filteredColumns}
            onDropAt={handleDropAt}
            onEdit={handleEdit}
            onRemove={(id) => void handleRemove(id)}
            onAddToColumn={(columnKey) => openAddModal(columnKey)}
            normalizeImageUrl={normalizeImageUrl}
            showStreamerBadge={false}
            streamerLabels={{}}
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AdminSection>

      <AddGameModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        initialStatus={addModalInitialStatus}
        submitting={submitting}
        onAddFromIgdb={async (game, status, meta) => {
          setSubmitting(true);
          try {
            await addFromIgdb(game, status, boardStreamerId, meta);
          } finally {
            setSubmitting(false);
          }
        }}
        onAddCustom={async (title, image, status, meta) => {
          setSubmitting(true);
          try {
            await addCustom(title, image, status, boardStreamerId, meta);
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <KanbanGameEditDrawer
        open={editDrawerOpen}
        item={editItem}
        saving={submitting}
        normalizeImageUrl={normalizeImageUrl}
        onOpenChange={(open) => {
          setEditDrawerOpen(open);
          if (!open) setEditItem(null);
        }}
        onSave={(id, patch) => void handleSaveMeta(id, patch)}
        onRemove={(id) => void handleRemove(id)}
      />
    </>
  );
}
