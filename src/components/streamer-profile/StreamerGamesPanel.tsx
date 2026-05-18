"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { StreamerGamesTab } from "@/components/streamer-profile/StreamerGamesTab";
import { useStreamerProfile } from "@/contexts/StreamerProfileContext";

export function StreamerGamesPanel() {
  const {
    streamer,
    streamerGames,
    setStreamerGames,
    gamesFetching,
    setGamesFetching,
    openGame,
  } = useStreamerProfile();

  const [gamesQuery, setGamesQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [finishedYear, setFinishedYear] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"title_asc" | "recent">("title_asc");
  const [gamesView, setGamesView] = useState<"grid" | "table">("grid");
  const [tableSortKey, setTableSortKey] = useState<
    "status" | "title" | "platform" | "updatedAt"
  >("title");
  const [tableSortDir, setTableSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const skipInitialFetch = useRef(true);

  const handleTableSortChange = useCallback(
    (
      key: "status" | "title" | "platform" | "updatedAt",
      dir: "asc" | "desc"
    ) => {
      setTableSortKey(key);
      setTableSortDir(dir);
    },
    []
  );

  useEffect(() => {
    if (!streamer?.id) return;
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setGamesFetching(true);
        const params = new URLSearchParams({ streamerId: streamer.id });
        const q = gamesQuery.trim();
        const status = statusFilter !== "all" ? statusFilter : "";
        if (q) params.set("q", q);
        if (status) params.set("status", status);
        if (finishedYear && finishedYear !== "all") {
          params.set("finishedYear", finishedYear);
        }
        const res = await fetch(`/api/streamer-games?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (Array.isArray(data)) setStreamerGames(data);
      } catch {
        /* ignore aborts */
      } finally {
        setGamesFetching(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [
    streamer?.id,
    gamesQuery,
    statusFilter,
    finishedYear,
    setStreamerGames,
    setGamesFetching,
  ]);

  return (
    <TabsContent value="jogos" className="mt-0" forceMount>
      <StreamerGamesTab
        streamerGames={streamerGames}
        gamesQuery={gamesQuery}
        onGamesQueryChange={setGamesQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        gamesView={gamesView}
        onGamesViewChange={setGamesView}
        tableSortKey={tableSortKey}
        tableSortDir={tableSortDir}
        onTableSortChange={handleTableSortChange}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        finishedYear={finishedYear}
        onFinishedYearChange={setFinishedYear}
        onGameClick={openGame}
      />
      {gamesFetching ? (
        <p className="mt-2 text-xs text-muted-foreground">Atualizando lista…</p>
      ) : null}
    </TabsContent>
  );
}
