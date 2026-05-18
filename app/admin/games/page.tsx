"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminChannelOptions } from "@/hooks/useAdminChannelOptions";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { AddGamePanel } from "@/components/admin/games/AddGamePanel";
import { KanbanBoard } from "@/components/admin/games/KanbanBoard";
import type { KanbanGameMetaPatch } from "@/components/admin/games/KanbanCard";
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
  statusLabel,
} from "@/components/admin/games/kanban-config";
import { finishedInYear, toDate } from "@/lib/streamer-game-status";

export default function AdminGames() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    resolveFormStreamerId,
    channels,
  } = useAdminChannelOptions();

  const channelKey = useMemo(
    () => channels.map((c) => c.id).sort().join(","),
    [channels]
  );

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState("");
  const [boardTarget, setBoardTarget] = useState("");
  const [boardYear, setBoardYear] = useState<string>("all");

  const boardStreamerId = useMemo(
    () => resolveFormStreamerId(boardTarget),
    [boardTarget, resolveFormStreamerId]
  );

  const boardFinishedYears = useMemo(() => {
    const years = new Set<number>();
    for (const it of items) {
      if (it.status !== "finished" && it.status !== "dropped") continue;
      const d = toDate(it.finishedAt);
      if (d) years.add(d.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const boardItems = useMemo(() => {
    if (boardYear === "all") return items;
    const y = parseInt(boardYear, 10);
    if (Number.isNaN(y)) return items;
    return items.filter((it) => {
      if (it.status === "to_play" || it.status === "playing") return true;
      return finishedInYear(it, y);
    });
  }, [items, boardYear]);

  const grouped = useMemo(() => {
    const byStatus = {
      to_play: boardItems.filter((i) => i.status === "to_play"),
      playing: boardItems.filter((i) => i.status === "playing"),
      finished: boardItems.filter((i) => i.status === "finished"),
      dropped: boardItems.filter((i) => i.status === "dropped"),
    } as const;
    const sortFn = (a: any, b: any) => {
      const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      const at = (a.game?.title || a.customTitle || "").toLowerCase();
      const bt = (b.game?.title || b.customTitle || "").toLowerCase();
      return at.localeCompare(bt);
    };
    return {
      to_play: [...byStatus.to_play].sort(sortFn),
      playing: [...byStatus.playing].sort(sortFn),
      finished: [...byStatus.finished].sort(sortFn),
      dropped: [...byStatus.dropped].sort(sortFn),
    } as const;
  }, [boardItems]);

  const columns = useMemo(
    () =>
      KANBAN_COLUMNS.map((meta) => ({
        key: meta.key,
        title: meta.title,
        items: grouped[meta.key],
      })),
    [grouped]
  );

  function normalizeImageUrl(raw?: string | null) {
    if (!raw) {
      return "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
    }
    const full = raw.startsWith("//") ? `https:${raw}` : raw;
    let url = full.replace("/t_thumb/", "/t_720p/");
    if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
    return url;
  }

  useEffect(() => {
    if (!channelKey) return;

    let cancelled = false;

    (async () => {
      if (!boardStreamerId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/streamer-games?streamerId=${encodeURIComponent(boardStreamerId)}`
        );
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os jogos.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // channels e toast lidos do closure; channelKey dispara reload quando canais mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardStreamerId, channelKey]);

  async function moveGameToColumn(
    draggedId: string,
    columnKey: KanbanColumnKey,
    beforeId: string | null
  ) {
    const item = items.find((i) => i.id === draggedId);
    if (!item) return;

    const targetCol = grouped[columnKey].filter((i) => i.id !== draggedId);
    let insertIndex = beforeId
      ? targetCol.findIndex((i) => i.id === beforeId)
      : targetCol.length;
    if (insertIndex < 0) insertIndex = targetCol.length;

    const newSortOrder = (insertIndex + 1) * 10;
    const previousItems = items;

    setItems((prev) =>
      prev.map((it) =>
        it.id === draggedId
          ? { ...it, status: columnKey, sortOrder: newSortOrder }
          : it
      )
    );

    try {
      const res = await fetch(`/api/streamer-games/${draggedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: columnKey, sortOrder: newSortOrder }),
      });
      const updated = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(updated?.error || "Falha ao salvar");
      }
      if (updated?.id) {
        setItems((prev) =>
          prev.map((it) => (it.id === draggedId ? { ...it, ...updated } : it))
        );
      }
    } catch (e) {
      setItems(previousItems);
      toast({
        title: "Erro",
        description:
          e instanceof Error ? e.message : "Não foi possível mover o jogo.",
        variant: "destructive",
      });
    }
  }

  function handleDropAt(
    columnKey: KanbanColumnKey,
    beforeId: string | null,
    draggedId: string
  ) {
    void moveGameToColumn(draggedId, columnKey, beforeId);
  }

  async function saveGameMeta(id: string, patch: KanbanGameMetaPatch) {
    try {
      const res = await fetch(`/api/streamer-games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json().catch(() => null);
      if (!res.ok) throw new Error(updated?.error);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
      );
      toast({ title: "Jogo atualizado" });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    }
  }

  async function addFromIGDB(
    sel: any,
    status: KanbanStatus,
    meta?: { startedAt?: string }
  ) {
    const streamerId = resolveFormStreamerId(formTarget);
    if (!streamerId) return;
    try {
      const body = {
        igdbId: sel.id,
        title: sel.name,
        image: sel.cover?.url || null,
        synopsis: sel.summary || null,
      };
      const gameRes = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const game = await gameRes.json();
      const sgRes = await fetch("/api/streamer-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerId,
          gameId: game.id,
          status,
          startedAt: meta?.startedAt,
        }),
      });
      const sg = await sgRes.json();
      if (!sgRes.ok) throw new Error(sg.error);
      const enriched = {
        ...sg,
        streamerId,
        game: sg.game ?? {
          title: game.title,
          image: game.image,
          synopsis: game.synopsis,
        },
      };
      setItems((prev) => [enriched, ...prev]);
      toast({
        title: "Jogo adicionado",
        description: `${sel.name} (${statusLabel(status)})`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o jogo",
        variant: "destructive",
      });
    }
  }

  async function addCustom(
    title: string,
    image: string | undefined,
    status: KanbanStatus,
    meta?: { startedAt?: string }
  ) {
    const streamerId = resolveFormStreamerId(formTarget);
    if (!streamerId) return;
    try {
      const res = await fetch("/api/streamer-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerId,
          customTitle: title,
          customImage: image || null,
          status,
          startedAt: meta?.startedAt,
        }),
      });
      const sg = await res.json();
      if (!res.ok) throw new Error(sg.error);
      const enriched = {
        ...sg,
        streamerId,
        customTitle: sg.customTitle ?? title,
        customImage: sg.customImage ?? image ?? null,
      };
      setItems((prev) => [enriched, ...prev]);
      toast({
        title: "Jogo adicionado",
        description: `${title} (${statusLabel(status)})`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o jogo",
        variant: "destructive",
      });
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/streamer-games/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Removido" });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover o jogo",
        variant: "destructive",
      });
    }
  }

  if (!ownerChannel && channels.length === 0) return null;

  return (
    <>
      <AdminPageHeader
        title="Gerenciar Jogos"
        description="Organize sua biblioteca em um board fluido. Arraste entre colunas para atualizar o status."
      />

      <div className="space-y-8">
        <AddGamePanel
          onAddFromIGDB={addFromIGDB}
          onAddCustom={addCustom}
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
                  {boardFinishedYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Zerados em {y}
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
              {KANBAN_COLUMNS.map((col) => (
                <div
                  key={col.key}
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
