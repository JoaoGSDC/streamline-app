"use client";

import { useEffect, useState } from "react";
import { services } from "@services";
import type { GameSearchResult } from "@features/search/types/search.types";

const MAX_RECENT = 6;

function coverFromStored(raw?: string | null): { url: string } | undefined {
  if (!raw) return undefined;
  const url = raw.startsWith("//") ? raw : raw.startsWith("http") ? raw : `//${raw}`;
  return { url };
}

function mapBoardGameToSearchResult(
  item: Awaited<
    ReturnType<typeof services.streamerGames.findAll.byParams>
  >[number]
): GameSearchResult | null {
  const title = item.game?.title || item.customTitle;
  if (!title) return null;

  if (item.game?.igdbId) {
    return {
      id: item.game.igdbId,
      name: title,
      cover: coverFromStored(item.game.image || item.customImage),
    };
  }

  return {
    id: -1,
    name: title,
    cover: coverFromStored(item.customImage || item.game?.image),
  };
}

export function useRecentBoardGames(streamerId: string) {
  const [recentGames, setRecentGames] = useState<GameSearchResult[]>([]);

  useEffect(() => {
    if (!streamerId) {
      setRecentGames([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const items = await services.streamerGames.findAll.byParams({ streamerId });
        if (cancelled) return;

        const sorted = [...items].sort((itemA, itemB) => {
          const orderA = itemA.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = itemB.sortOrder ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;

          const startedA = itemA.startedAt
            ? new Date(itemA.startedAt).getTime()
            : 0;
          const startedB = itemB.startedAt
            ? new Date(itemB.startedAt).getTime()
            : 0;
          return startedB - startedA;
        });

        const mapped = sorted
          .map(mapBoardGameToSearchResult)
          .filter((game): game is GameSearchResult => game !== null)
          .slice(0, MAX_RECENT);

        setRecentGames(mapped);
      } catch (error) {
        console.error("Error loading recent board games:", error);
        if (!cancelled) setRecentGames([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [streamerId]);

  return recentGames;
}
