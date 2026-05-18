"use client";

import { useMemo, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  StreamerGameCoverCard,
  buildGameFromStreamerItem,
} from "@/components/streamer-profile/StreamerGameCoverCard";
import { StreamerGameStatusBadge } from "@/components/streamer-profile/StreamerGameStatusBadge";
import { toDate } from "@/lib/streamer-game-status";

type SortKey = "title_asc" | "recent";
type GamesView = "grid" | "table";
type TableSortKey = "status" | "title" | "platform" | "updatedAt";

function normalizeGameImage(raw?: string | null) {
  const fallback =
    "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
  if (!raw) return fallback;
  const full = raw.startsWith("//") ? `https:${raw}` : raw;
  let url = full.replace("/t_thumb/", "/t_720p/");
  if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
  return url || fallback;
}

interface StreamerGamesTabProps {
  streamerGames: any[];
  gamesQuery: string;
  onGamesQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  gamesView: GamesView;
  onGamesViewChange: (view: GamesView) => void;
  tableSortKey: TableSortKey;
  tableSortDir: "asc" | "desc";
  onTableSortChange: (key: TableSortKey, dir: "asc" | "desc") => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  finishedYear: string;
  onFinishedYearChange: (year: string) => void;
  onGameClick: (game: any) => void;
}

function GamesGridSection({
  title,
  items,
  onGameClick,
}: {
  title: string;
  items: any[];
  onGameClick: (game: any) => void;
}) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-xl font-semibold">
        {title} ({items.length})
      </h3>

      <div className="streamer-games-carousel sm:hidden">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum jogo</p>
        ) : (
          items.map((it: any) => (
            <StreamerGameCoverCard
              key={it.id}
              imageUrl={normalizeGameImage(it.game?.image || it.customImage || null)}
              hasNotes={Boolean(it.notes?.trim())}
              onClick={() => onGameClick(buildGameFromStreamerItem(it))}
            />
          ))
        )}
      </div>

      <div className="streamer-games-grid">
        {items.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">
            Nenhum jogo
          </p>
        ) : (
          items.map((it: any) => (
            <StreamerGameCoverCard
              key={it.id}
              imageUrl={normalizeGameImage(it.game?.image || it.customImage || null)}
              hasNotes={Boolean(it.notes?.trim())}
              onClick={() => onGameClick(buildGameFromStreamerItem(it))}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function StreamerGamesTab({
  streamerGames,
  gamesQuery,
  onGamesQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  onSortKeyChange,
  gamesView,
  onGamesViewChange,
  tableSortKey,
  tableSortDir,
  onTableSortChange,
  page,
  onPageChange,
  pageSize,
  finishedYear,
  onFinishedYearChange,
  onGameClick,
}: StreamerGamesTabProps) {
  const finishedYears = useMemo(() => {
    const years = new Set<number>();
    for (const it of streamerGames) {
      if (it.status !== "finished" && it.status !== "dropped") continue;
      const d = toDate(it.finishedAt);
      if (d) years.add(d.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [streamerGames]);

  const applySortKey = useCallback(
    (key: SortKey) => {
      onSortKeyChange(key);
      if (key === "title_asc") {
        onTableSortChange("title", "asc");
      } else {
        onTableSortChange("updatedAt", "desc");
      }
      onPageChange(1);
    },
    [onSortKeyChange, onTableSortChange, onPageChange]
  );

  const { sorted, groups } = useMemo(() => {
    const normalized = streamerGames.map((it: any) => {
      const title = it.game?.title || it.customTitle || "";
      const updatedAt = it.updatedAt ? new Date(it.updatedAt).getTime() : 0;
      return { ...it, _title: title.toLowerCase(), _updatedAt: updatedAt };
    });

    const list = [...normalized].sort((a, b) => {
      if (gamesView === "grid") {
        if (sortKey === "recent")
          return (b._updatedAt || 0) - (a._updatedAt || 0);
        return (a._title || "").localeCompare(b._title || "");
      }
      let valA: string | number;
      let valB: string | number;
      if (tableSortKey === "status") {
        const order = { playing: 3, to_play: 2, finished: 1, dropped: 0 } as Record<
          string,
          number
        >;
        valA = order[a.status] ?? -1;
        valB = order[b.status] ?? -1;
      } else if (tableSortKey === "title") {
        valA = a._title || "";
        valB = b._title || "";
      } else {
        valA = a._updatedAt || 0;
        valB = b._updatedAt || 0;
      }
      const comp =
        typeof valA === "number"
          ? valA - (valB as number)
          : String(valA).localeCompare(String(valB));
      return tableSortDir === "asc" ? comp : -comp;
    });

    return {
      sorted: list,
      groups: {
        to_play: list.filter((i: any) => i.status === "to_play"),
        playing: list.filter((i: any) => i.status === "playing"),
        finished: list.filter((i: any) => i.status === "finished"),
        dropped: list.filter((i: any) => i.status === "dropped"),
      },
    };
  }, [streamerGames, gamesView, sortKey, tableSortKey, tableSortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const handleColumnSort = (key: TableSortKey) => {
    if (tableSortKey === key) {
      const nextDir = tableSortDir === "asc" ? "desc" : "asc";
      onTableSortChange(key, nextDir);
      if (key === "title" && nextDir === "asc") onSortKeyChange("title_asc");
      else if (key === "updatedAt" && nextDir === "desc")
        onSortKeyChange("recent");
    } else {
      const nextDir = key === "updatedAt" ? "desc" : "asc";
      onTableSortChange(key, nextDir);
      if (key === "title" && nextDir === "asc") onSortKeyChange("title_asc");
      else if (key === "updatedAt" && nextDir === "desc")
        onSortKeyChange("recent");
    }
    onPageChange(1);
  };

  const headerClass = (key: TableSortKey) =>
    `cursor-pointer select-none ${tableSortKey === key ? "text-foreground" : "text-muted-foreground"}`;

  const sortIndicator = (key: TableSortKey) =>
    tableSortKey === key ? (tableSortDir === "asc" ? "▲" : "▼") : "";

  const toolbar = (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Buscar jogo"
        value={gamesQuery}
        onChange={(e) => {
          onGamesQueryChange(e.target.value);
          onPageChange(1);
        }}
        className="sm:w-64"
        autoComplete="off"
      />
      <Select
        value={statusFilter}
        onValueChange={(v) => {
          onStatusFilterChange(v);
          onPageChange(1);
        }}
      >
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="playing">Jogando</SelectItem>
          <SelectItem value="to_play">Para jogar</SelectItem>
          <SelectItem value="finished">Concluído</SelectItem>
          <SelectItem value="dropped">Droppado</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={finishedYear}
        onValueChange={(v) => {
          onFinishedYearChange(v);
          onPageChange(1);
        }}
      >
        <SelectTrigger className="sm:w-52">
          <SelectValue placeholder="Ano (zerados)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os anos</SelectItem>
          {finishedYears.map((y) => (
            <SelectItem key={y} value={String(y)}>
              Zerados em {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sortKey}
        onValueChange={(v) => applySortKey(v as SortKey)}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title_asc">Título (A-Z)</SelectItem>
          <SelectItem value="recent">Recentes</SelectItem>
        </SelectContent>
      </Select>
      <div className="ml-auto flex gap-2">
        <Button
          variant={gamesView === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            onGamesViewChange("grid");
            onPageChange(1);
          }}
        >
          Grade
        </Button>
        <Button
          variant={gamesView === "table" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            onGamesViewChange("table");
            onPageChange(1);
          }}
        >
          Tabela
        </Button>
      </div>
    </div>
  );

  if (gamesView === "grid") {
    return (
      <>
        {toolbar}
        <GamesGridSection
          title="Para jogar"
          items={groups.to_play}
          onGameClick={onGameClick}
        />
        <GamesGridSection
          title="Jogando"
          items={groups.playing}
          onGameClick={onGameClick}
        />
        <GamesGridSection
          title="Zerados"
          items={groups.finished}
          onGameClick={onGameClick}
        />
        <GamesGridSection
          title="Droppados"
          items={groups.dropped}
          onGameClick={onGameClick}
        />
      </>
    );
  }

  return (
    <>
      {toolbar}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={headerClass("title")}
                onClick={() => handleColumnSort("title")}
              >
                Jogo {sortIndicator("title")}
              </TableHead>
              <TableHead
                className={headerClass("status")}
                onClick={() => handleColumnSort("status")}
              >
                Status {sortIndicator("status")}
              </TableHead>
              <TableHead
                className={headerClass("updatedAt")}
                onClick={() => handleColumnSort("updatedAt")}
              >
                Atualizado {sortIndicator("updatedAt")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  Nenhum jogo
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((it: any) => {
                const title = it.game?.title || it.customTitle || "Jogo";
                const img = normalizeGameImage(
                  it.game?.image || it.customImage || null
                );
                const updated = it.updatedAt
                  ? new Date(it.updatedAt).toLocaleDateString("pt-BR")
                  : "-";
                return (
                  <TableRow
                    key={it.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onGameClick(buildGameFromStreamerItem(it))}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={title}
                          className="h-12 w-12 border border-border object-cover"
                        />
                        <div className="font-medium">{title}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StreamerGameStatusBadge status={it.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {updated}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(Math.max(1, safePage - 1));
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    href="#"
                    isActive={safePage === idx + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(idx + 1);
                    }}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(Math.min(totalPages, safePage + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="flex flex-col gap-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum jogo</p>
          ) : (
            sorted.map((it: any) => {
              const title = it.game?.title || it.customTitle || "Jogo";
              const img = normalizeGameImage(
                it.game?.image || it.customImage || null
              );
              return (
                <button
                  key={it.id}
                  type="button"
                  className="glass-panel flex w-full items-center justify-between gap-3 rounded-md border border-outline-variant/40 p-2 text-left transition-all duration-fast hover:border-primary/50 hover:shadow-glow-cyan"
                  onClick={() => onGameClick(buildGameFromStreamerItem(it))}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={img}
                      alt={title}
                      className="h-12 w-12 border border-border object-cover"
                    />
                    <div className="line-clamp-2 text-sm font-medium">
                      {title}
                    </div>
                  </div>
                  <StreamerGameStatusBadge status={it.status} />
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
