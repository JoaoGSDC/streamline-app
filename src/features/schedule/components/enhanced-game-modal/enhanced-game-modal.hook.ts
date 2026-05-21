"use client";

import { useEffect, useState } from "react";
import { services } from "@services";

interface StreamGameData {
  igdbGameId?: number | null;
  igdb_game_id?: number;
  gameTitle?: string | null;
  game?: {
    title?: string;
    igdbId?: number;
    storeLinks?: Array<{ name: string; url: string }>;
  } | null;
}

export function useEnhancedGameModal(
  open: boolean,
  streamData: StreamGameData | null
) {
  const [storeLinks, setStoreLinks] = useState<Array<{ name: string; url: string }>>(
    []
  );

  useEffect(() => {
    if (!streamData) {
      setStoreLinks([]);
      return;
    }
    setStoreLinks(streamData.game?.storeLinks || []);
  }, [streamData]);

  useEffect(() => {
    if (!open || !streamData) return;

    let aborted = false;

    const loadStoreLinks = async () => {
      const igdbId =
        streamData.igdbGameId ??
        streamData.igdb_game_id ??
        streamData.game?.igdbId;

      let resolvedGameId = igdbId;

      if (!resolvedGameId) {
        const title = streamData.game?.title || streamData.gameTitle;
        if (!title) return;

        try {
          const searchResults = await services.igdb.games.search(title, 1);
          const firstMatch = searchResults[0];
          if (firstMatch?.id) {
            resolvedGameId = firstMatch.id;
          }
        } catch {
          return;
        }
      }

      if (!resolvedGameId) return;

      try {
        const gameDetails = await services.igdb.games.findById(resolvedGameId);
        if (!aborted && gameDetails && Array.isArray(gameDetails.storeLinks)) {
          setStoreLinks(gameDetails.storeLinks);
        }
      } catch {
        /* silencioso — links opcionais */
      }
    };

    void loadStoreLinks();

    return () => {
      aborted = true;
    };
  }, [open, streamData]);

  return { storeLinks };
}
