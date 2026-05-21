"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { services } from "@services";
import type { StreamerGameRecord, StreamerGameStatus } from "@services/entities/streamer-games.services";
import {
  KANBAN_COLUMNS,
  type KanbanColumnKey,
  type KanbanStatus,
  statusLabel,
} from "@/components/admin/games/kanban-config";
import { finishedInYear, toDate } from "@lib/streamer-game-status";
import type { KanbanGameMetaPatch } from "@/components/admin/games/KanbanCard";

interface UseAdminGamesBoardParams {
  boardStreamerId: string;
  channelKey: string;
  onLoadError: () => void;
  onToast: (payload: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useAdminGamesBoard({
  boardStreamerId,
  channelKey,
  onLoadError,
  onToast,
}: UseAdminGamesBoardParams) {
  const [items, setItems] = useState<StreamerGameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardYear, setBoardYear] = useState<string>("all");

  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const fetchedStreamerIdRef = useRef<string | null>(null);

  const loadItems = useCallback(async (streamerId: string) => {
    setLoading(true);
    try {
      const loadedItems = await services.streamerGames.findAll.byParams({
        streamerId,
      });
      setItems(loadedItems);
    } catch (loadError) {
      console.error(loadError);
      onLoadErrorRef.current();
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadItems = useCallback(async () => {
    if (!boardStreamerId) {
      fetchedStreamerIdRef.current = null;
      setItems([]);
      setLoading(false);
      return;
    }
    fetchedStreamerIdRef.current = null;
    await loadItems(boardStreamerId);
    fetchedStreamerIdRef.current = boardStreamerId;
  }, [boardStreamerId, loadItems]);

  useEffect(() => {
    if (!channelKey || !boardStreamerId) {
      fetchedStreamerIdRef.current = null;
      setItems([]);
      setLoading(false);
      return;
    }

    if (fetchedStreamerIdRef.current === boardStreamerId) return;

    fetchedStreamerIdRef.current = boardStreamerId;
    let cancelled = false;

    void (async () => {
      await loadItems(boardStreamerId);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [boardStreamerId, channelKey, loadItems]);

  const boardFinishedYears = useMemo(() => {
    const years = new Set<number>();
    for (const boardItem of items) {
      if (boardItem.status !== "finished" && boardItem.status !== "dropped") continue;
      const finishedDate = toDate(boardItem.finishedAt);
      if (finishedDate) years.add(finishedDate.getFullYear());
    }
    return Array.from(years).sort((yearA, yearB) => yearB - yearA);
  }, [items]);

  const boardItems = useMemo(() => {
    if (boardYear === "all") return items;
    const filterYear = parseInt(boardYear, 10);
    if (Number.isNaN(filterYear)) return items;
    return items.filter((boardItem) => {
      if (boardItem.status === "to_play" || boardItem.status === "playing") {
        return true;
      }
      return finishedInYear(boardItem, filterYear);
    });
  }, [items, boardYear]);

  const grouped = useMemo(() => {
    const byStatus = {
      to_play: boardItems.filter((item) => item.status === "to_play"),
      playing: boardItems.filter((item) => item.status === "playing"),
      finished: boardItems.filter((item) => item.status === "finished"),
      dropped: boardItems.filter((item) => item.status === "dropped"),
    } as const;

    const sortFn = (itemA: StreamerGameRecord, itemB: StreamerGameRecord) => {
      const orderA = itemA.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = itemB.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      const titleA = (itemA.game?.title || itemA.customTitle || "").toLowerCase();
      const titleB = (itemB.game?.title || itemB.customTitle || "").toLowerCase();
      return titleA.localeCompare(titleB);
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
      KANBAN_COLUMNS.map((columnMeta) => ({
        key: columnMeta.key,
        title: columnMeta.title,
        items: grouped[columnMeta.key],
      })),
    [grouped]
  );

  const moveGameToColumn = useCallback(
    async (
      draggedId: string,
      columnKey: KanbanColumnKey,
      beforeId: string | null
    ) => {
      const draggedItem = items.find((item) => item.id === draggedId);
      if (!draggedItem) return;

      const targetColumn = grouped[columnKey].filter((item) => item.id !== draggedId);
      let insertIndex = beforeId
        ? targetColumn.findIndex((item) => item.id === beforeId)
        : targetColumn.length;
      if (insertIndex < 0) insertIndex = targetColumn.length;

      const newSortOrder = (insertIndex + 1) * 10;
      const previousItems = items;

      setItems((previous) =>
        previous.map((item) =>
          item.id === draggedId
            ? { ...item, status: columnKey, sortOrder: newSortOrder }
            : item
        )
      );

      try {
        const updated = await services.streamerGames.update(draggedId, {
          status: columnKey as StreamerGameStatus,
          sortOrder: newSortOrder,
        });
        if (updated?.id) {
          setItems((previous) =>
            previous.map((item) =>
              item.id === draggedId ? { ...item, ...updated } : item
            )
          );
        }
      } catch (moveError) {
        setItems(previousItems);
        onToastRef.current({
          title: "Erro",
          description:
            moveError instanceof Error
              ? moveError.message
              : "Não foi possível mover o jogo.",
          variant: "destructive",
        });
      }
    },
    [grouped, items, onToast]
  );

  const handleDropAt = useCallback(
    (columnKey: KanbanColumnKey, beforeId: string | null, draggedId: string) => {
      void moveGameToColumn(draggedId, columnKey, beforeId);
    },
    [moveGameToColumn]
  );

  const saveGameMeta = useCallback(
    async (streamerGameId: string, patch: KanbanGameMetaPatch) => {
      try {
        const updated = await services.streamerGames.update(streamerGameId, patch);
        setItems((previous) =>
          previous.map((item) =>
            item.id === streamerGameId ? { ...item, ...updated } : item
          )
        );
        onToastRef.current({ title: "Jogo atualizado" });
      } catch {
        onToastRef.current({
          title: "Erro",
          description: "Não foi possível salvar as alterações",
          variant: "destructive",
        });
      }
    },
    [onToast]
  );

  const addFromIgdb = useCallback(
    async (
      selectedGame: { id: number; name: string; cover?: { url: string }; summary?: string },
      status: KanbanStatus,
      streamerId: string,
      meta?: { startedAt?: string }
    ) => {
      if (!streamerId) return;

      try {
        const createdGame = await services.games.create({
          igdbId: selectedGame.id,
          title: selectedGame.name,
          image: selectedGame.cover?.url || null,
          synopsis: selectedGame.summary || null,
        });

        const streamerGame = await services.streamerGames.create({
          streamerId,
          gameId: createdGame.id,
          status: status as StreamerGameStatus,
          startedAt: meta?.startedAt,
        });

        const enriched = {
          ...streamerGame,
          streamerId,
          game: streamerGame.game ?? {
            title: createdGame.title,
            image: createdGame.image,
            synopsis: createdGame.synopsis,
          },
        };

        setItems((previous) => [enriched, ...previous]);
        onToastRef.current({
          title: "Jogo adicionado",
          description: `${selectedGame.name} (${statusLabel(status)})`,
        });
      } catch {
        onToastRef.current({
          title: "Erro",
          description: "Não foi possível adicionar o jogo",
          variant: "destructive",
        });
      }
    },
    [onToast]
  );

  const addCustom = useCallback(
    async (
      title: string,
      image: string | undefined,
      status: KanbanStatus,
      streamerId: string,
      meta?: { startedAt?: string }
    ) => {
      if (!streamerId) return;

      try {
        const streamerGame = await services.streamerGames.create({
          streamerId,
          customTitle: title,
          customImage: image || null,
          status: status as StreamerGameStatus,
          startedAt: meta?.startedAt,
        });

        const enriched = {
          ...streamerGame,
          streamerId,
          customTitle: streamerGame.customTitle ?? title,
          customImage: streamerGame.customImage ?? image ?? null,
        };

        setItems((previous) => [enriched, ...previous]);
        onToastRef.current({
          title: "Jogo adicionado",
          description: `${title} (${statusLabel(status)})`,
        });
      } catch {
        onToastRef.current({
          title: "Erro",
          description: "Não foi possível adicionar o jogo",
          variant: "destructive",
        });
      }
    },
    [onToast]
  );

  const remove = useCallback(
    async (streamerGameId: string) => {
      try {
        await services.streamerGames.remove(streamerGameId);
        setItems((previous) =>
          previous.filter((item) => item.id !== streamerGameId)
        );
        onToastRef.current({ title: "Removido" });
      } catch {
        onToastRef.current({
          title: "Erro",
          description: "Não foi possível remover o jogo",
          variant: "destructive",
        });
      }
    },
    [onToast]
  );

  return {
    items,
    loading,
    boardYear,
    boardFinishedYears,
    columns,
    grouped,
    setBoardYear,
    handleDropAt,
    saveGameMeta,
    addFromIgdb,
    addCustom,
    remove,
  };
}
