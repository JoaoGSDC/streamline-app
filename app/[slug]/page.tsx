"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StreamerHeader } from "@/components/StreamerHeader";
import { ViewToggle, ViewType } from "@/components/ViewToggle";
import { DailyView } from "@/components/schedule/DailyView";
import { WeeklyView } from "@/components/schedule/WeeklyView";
import { CalendarView } from "@/components/schedule/CalendarView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks";
import { GameModal } from "@/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function StreamerSchedule() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user: currentUser, isAuthenticated, logout } = useAuth();

  const [currentView, setCurrentView] = useState<ViewType>("daily");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamer, setStreamer] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loadingStreamer, setLoadingStreamer] = useState(true);
  const [streamerGames, setStreamerGames] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [gamesQuery, setGamesQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"title_asc" | "recent">("recent");
  const [gamesView, setGamesView] = useState<"grid" | "table">("table");
  const [tableSortKey, setTableSortKey] = useState<"status" | "title" | "platform" | "updatedAt">("updatedAt");
  const [tableSortDir, setTableSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      console.error("Twitch API credentials are missing.");
      router.push("/");
      return;
    }

    const fetchAccessToken = async (): Promise<string> => {
      const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!res.ok) throw new Error("Failed to obtain Twitch access token");

      const data = await res.json();
      return data.access_token;
    };

    const fetchStreamerBySlug = async (accessToken: string) => {
      const res = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(slug)}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch Twitch user");

      const data = await res.json();
      return data.data?.[0];
    };

    const normalizeStreamer = (apiStreamer: any, accessToken: string) => ({
      id: apiStreamer.id,
      name: apiStreamer.display_name || apiStreamer.login,
      twitchUsername: apiStreamer.login,
      avatar: apiStreamer.profile_image_url,
      bio: apiStreamer.description || "",
      twitchUrl: `https://twitch.tv/${apiStreamer.login}`,
      followers: "", // followers count not directly available here
      accessToken,
      broadcasterType: apiStreamer.broadcaster_type,
      createdAt: apiStreamer.created_at,
    });

    const fetchStreamerAndGames = async () => {
      setLoadingStreamer(true);

      try {
        const accessToken = await fetchAccessToken();
        const apiStreamer = await fetchStreamerBySlug(accessToken);

        if (!apiStreamer) throw new Error("Streamer not found");

        const normalizedStreamer = normalizeStreamer(apiStreamer, accessToken);
        setStreamer(normalizedStreamer);

        setLoadingLists(true);
        const fetchScheduled = fetch(
          `/api/scheduled-streams?streamerId=${normalizedStreamer.id}`
        ).then((r) => r.json());
        const fetchStreamerGames = fetch(
          `/api/streamer-games?streamerId=${normalizedStreamer.id}`
        ).then((r) => r.json());

        const [streams, sgdata] = await Promise.allSettled([
          fetchScheduled,
          fetchStreamerGames,
        ]);

        if (streams.status === "fulfilled") {
          const baseMapped = (Array.isArray(streams.value) ? streams.value : []).map(
            (s: any) => {
              const igdbId = s.game?.igdbId || s.igdbGameId || s.igdb_game_id || null;
              const raw = s.game?.image || s.gameImage || null;
              const img = (() => {
                const fallback = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
                if (!raw) return fallback;
                const full = raw.startsWith("//") ? `https:${raw}` : raw;
                let url = full.replace("/t_thumb/", "/t_1080p/");
                if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
                return url || fallback;
              })();
              return {
                id: s.id,
                title: s.game?.title || s.gameTitle || "Jogo",
                image: img,
                scheduledTime: new Date(s.scheduledDate).toLocaleString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                scheduledAt: new Date(s.scheduledDate).getTime(),
                duration: s.duration,
                platform: s.game?.platform || "",
                synopsis: s.game?.synopsis || s.gameSynopsis || "",
                streamUrl: `https://twitch.tv/${normalizedStreamer.twitchUsername}`,
                website: undefined as string | undefined,
                storeLinks: (s.game?.storeLinks as Array<{ name: string; url: string }>) || [],
                notes: s.notes || undefined,
                igdbId,
                raw: s,
              };
            }
          );
          setGames(baseMapped.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt));
        }

        if (sgdata.status === "fulfilled") {
          setStreamerGames(Array.isArray(sgdata.value) ? sgdata.value : []);
        } else {
          setStreamerGames([]);
        }
        setLoadingLists(false);
      } catch (err) {
        console.error("Failed to fetch streamer data:", err);
        router.push("/");
      } finally {
        setLoadingStreamer(false);
      }
    };

    fetchStreamerAndGames();
  }, [slug, router]);

  // Debounced fetch for streamer games (server-side filtering by q and status)
  useEffect(() => {
    if (!streamer?.id) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoadingLists(true);
        const params = new URLSearchParams({ streamerId: streamer.id });
        const q = gamesQuery.trim();
        const status = statusFilter !== "all" ? statusFilter : "";
        if (q) params.set("q", q);
        if (status) params.set("status", status);
        const res = await fetch(`/api/streamer-games?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (Array.isArray(data)) setStreamerGames(data);
      } catch (_e) {
        // ignore aborts
      } finally {
        setLoadingLists(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [streamer?.id, gamesQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [gamesQuery]);

  const handleGameClick = (game: any) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case "daily":
        return "Agenda de Hoje";
      case "weekly":
        return "Agenda da Semana";
      case "monthly":
        return "Agenda do Mês";
    }
  };

  const isLoading = !streamer || loadingStreamer || loadingLists;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Verificar se o usuário logado é o proprietário do perfil
  const isOwnProfile = () => {
    if (!isAuthenticated || !currentUser || !streamer) return false;
    return currentUser.twitchUsername === streamer.twitchUsername;
  };

  return (
    <div className="relative z-10">
      <header className="relative top-2 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="text-primary"
            onClick={() => router.push("/")}
          >
            Início
          </Button>

          <div className="flex items-center gap-2">
            {isAuthenticated && currentUser ? (
              isOwnProfile() ? (
                <>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => router.push("/admin")}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Painel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/${currentUser.twitchUsername}`)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </Button>
              )
            ) : (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push("/auth")}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {streamer ? (
          <StreamerHeader {...streamer} />
        ) : (
          <div className="h-24 w-full bg-muted animate-pulse" />
        )}

        <Tabs defaultValue="agenda" className="mt-6">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="jogos">Jogos</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {getViewTitle()}
              </h2>
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-40 bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {currentView === "daily" && (
                  <DailyView games={games} onGameClick={handleGameClick} />
                )}
                {currentView === "weekly" && (
                  <WeeklyView games={games} onGameClick={handleGameClick} />
                )}
                {currentView === "monthly" && (
                  <CalendarView games={games} onGameClick={handleGameClick} />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="jogos" className="mt-6">
            {(() => {
                const normalized = streamerGames.map((it: any) => {
                  const title = it.game?.title || it.customTitle || "";
                  const updatedAt = it.updatedAt ? new Date(it.updatedAt).getTime() : 0;
                  return { ...it, _title: title.toLowerCase(), _updatedAt: updatedAt };
                });

                const filtered = normalized; // já filtrado no servidor por q e status

                const sorted = [...filtered].sort((a, b) => {
                  if (gamesView === "grid") {
                    if (sortKey === "recent") return (b._updatedAt || 0) - (a._updatedAt || 0);
                    return (a._title || "").localeCompare(b._title || "");
                  }
                  let valA: any;
                  let valB: any;
                  if (tableSortKey === "status") {
                    const order = { playing: 3, to_play: 2, finished: 1, dropped: 0 } as any;
                    valA = order[a.status] ?? -1;
                    valB = order[b.status] ?? -1;
                  } else if (tableSortKey === "title") {
                    valA = a._title || "";
                    valB = b._title || "";
                  } else {
                    valA = a._updatedAt || 0;
                    valB = b._updatedAt || 0;
                  }
                  const comp = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
                  return tableSortDir === "asc" ? comp : -comp;
                });

                const groups = {
                  to_play: sorted.filter((i: any) => i.status === "to_play"),
                  playing: sorted.filter((i: any) => i.status === "playing"),
                  finished: sorted.filter((i: any) => i.status === "finished"),
                  dropped: sorted.filter((i: any) => i.status === "dropped"),
                } as const;

                const normalize = (raw?: string | null) => {
                  const fallback = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
                  if (!raw) return fallback;
                  const full = raw.startsWith("//") ? `https:${raw}` : raw;
                  let url = full.replace("/t_thumb/", "/t_720p/");
                  if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
                  return url || fallback;
                };

                const statusLabel = (s: string) =>
                  s === "to_play" ? "Para jogar" : s === "playing" ? "Jogando" : s === "finished" ? "Concluído" : s === "dropped" ? "Droppado" : s;

                const statusBadgeVariant = (s: string) =>
                  s === "playing" ? "default" : s === "to_play" ? "secondary" : s === "finished" ? "outline" : "destructive";

                const Toolbar = () => (
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6">
                    <Input
                      placeholder="Buscar jogo"
                      value={gamesQuery}
                      onChange={(e) => setGamesQuery(e.target.value)}
                      className="sm:w-64"
                    />
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
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
                    {gamesView === "grid" && (
                      <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                        <SelectTrigger className="sm:w-40">
                          <SelectValue placeholder="Ordenar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Recentes</SelectItem>
                          <SelectItem value="title_asc">Título (A-Z)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="ml-auto flex gap-2">
                      <Button
                        variant={gamesView === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setGamesView("grid");
                          setPage(1);
                        }}
                      >
                        Grade
                      </Button>
                      <Button
                        variant={gamesView === "table" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setGamesView("table");
                          setPage(1);
                        }}
                      >
                        Tabela
                      </Button>
                    </div>
                  </div>
                );

                const Section = ({ title, items }: { title: string; items: any[] }) => (
                  <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-3">{title} ({items.length})</h3>

                    {/* Mobile: carrossel horizontal */}
                    <div className="sm:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory">
                      <div className="flex gap-3">
                        {items.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Nenhum jogo</p>
                        ) : (
                          items.map((it: any) => {
                            const title = it.game?.title || it.customTitle || "Jogo";
                            const img = normalize(it.game?.image || it.customImage || null);
                            const links: Array<{ name: string; url: string }> = it.game?.storeLinks || [];
                            return (
                              <div
                                key={it.id}
                                className="snap-start min-w-[160px] flex-shrink-0 flex flex-col gap-2 border border-border p-2 text-left hover:border-primary/50 transition-colors"
                                onClick={() => {
                                  const g = it.game
                                    ? {
                                        id: it.game.id,
                                        title: it.game.title,
                                        image: it.game.image,
                                        synopsis: it.game.synopsis,
                                        genre: it.game.genre,
                                        platform: it.game.platform,
                                        igdbId: it.game.igdbId,
                                        storeLinks: it.game.storeLinks,
                                        notes: it.notes,
                                      }
                                    : {
                                        id: it.id,
                                        title: it.customTitle,
                                        image: it.customImage,
                                        synopsis: undefined,
                                        genre: [],
                                        platform: undefined,
                                      };
                                  handleGameClick(g);
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <img src={img} alt={title} className="w-full h-24 object-cover" />
                                <div className="text-sm font-medium line-clamp-2">{title}</div>
                                {/* Loja: não exibir nas miniaturas */}
                                {(it.status === "finished" || it.status === "dropped") && it.notes && (
                                  <div className="text-xs text-muted-foreground line-clamp-2">{it.notes}</div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Desktop: 4-6 col grid */}
                    <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {items.length === 0 ? (
                        <p className="text-muted-foreground text-sm col-span-full">Nenhum jogo</p>
                      ) : (
                        items.map((it: any) => {
                          const title = it.game?.title || it.customTitle || "Jogo";
                          const img = normalize(it.game?.image || it.customImage || null);
                          const links: Array<{ name: string; url: string }> = it.game?.storeLinks || [];
                          return (
                            <div
                              key={it.id}
                              className="flex flex-col gap-2 border border-border p-2 text-left hover:border-primary/50 transition-colors"
                              onClick={() => {
                                const g = it.game
                                  ? {
                                      id: it.game.id,
                                      title: it.game.title,
                                      image: it.game.image,
                                      synopsis: it.game.synopsis,
                                      genre: it.game.genre,
                                      platform: it.game.platform,
                                      igdbId: it.game.igdbId,
                                      storeLinks: it.game.storeLinks,
                                    }
                                  : {
                                      id: it.id,
                                      title: it.customTitle,
                                      image: it.customImage,
                                      synopsis: undefined,
                                      genre: [],
                                      platform: undefined,
                                    };
                                handleGameClick(g);
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <img src={img} alt={title} className="w-full h-32 object-cover" />
                              <div className="text-sm font-medium line-clamp-2">{title}</div>
                              {/* Loja: não exibir nas miniaturas */}
                              {(it.status === "finished" || it.status === "dropped") && it.notes && (
                                <div className="text-xs text-muted-foreground line-clamp-2">{it.notes}</div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                );

                if (gamesView === "grid") {
                  return (
                    <>
                      <Toolbar />
                      <Section title="Para jogar" items={groups.to_play} />
                      <Section title="Jogando" items={groups.playing} />
                      <Section title="Zerados" items={groups.finished} />
                      <Section title="Droppados" items={groups.dropped} />
                    </>
                  );
                }

                const tableItems = sorted;
                const totalPages = Math.max(1, Math.ceil(tableItems.length / pageSize));
                const safePage = Math.min(page, totalPages);
                const sliceStart = (safePage - 1) * pageSize;
                const pageItems = tableItems.slice(sliceStart, sliceStart + pageSize);

                const setSort = (key: typeof tableSortKey) => {
                  if (tableSortKey === key) {
                    setTableSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  } else {
                    setTableSortKey(key);
                    setTableSortDir(key === "updatedAt" ? "desc" : "asc");
                  }
                };

                const headerClass = (key: typeof tableSortKey) =>
                  `cursor-pointer select-none ${tableSortKey === key ? "text-foreground" : "text-muted-foreground"}`;

                const sortIndicator = (key: typeof tableSortKey) =>
                  tableSortKey === key ? (tableSortDir === "asc" ? "▲" : "▼") : "";

                return (
                  <>
                    <Toolbar />
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className={headerClass("title")} onClick={() => setSort("title")}>
                              Jogo {sortIndicator("title")}
                            </TableHead>
                            <TableHead className={headerClass("status")} onClick={() => setSort("status")}>
                              Status {sortIndicator("status")}
                            </TableHead>
                            <TableHead className={headerClass("updatedAt")} onClick={() => setSort("updatedAt")}>
                              Atualizado {sortIndicator("updatedAt")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pageItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Nenhum jogo
                              </TableCell>
                            </TableRow>
                          ) : (
                            pageItems.map((it: any) => {
                              const title = it.game?.title || it.customTitle || "Jogo";
                              const img = normalize(it.game?.image || it.customImage || null);
                              const updated = it.updatedAt ? new Date(it.updatedAt).toLocaleDateString("pt-BR") : "-";
                              return (
                                <TableRow
                                  key={it.id}
                                  className="hover:bg-muted/50"
                                  onClick={() => {
                                    const g = it.game
                                      ? {
                                          id: it.game.id,
                                          title: it.game.title,
                                          image: it.game.image,
                                          synopsis: it.game.synopsis,
                                          genre: it.game.genre,
                                          platform: it.game.platform,
                                          igdbId: it.game.igdbId,
                                          notes: it.notes,
                                        }
                                      : {
                                          id: it.id,
                                          title: it.customTitle,
                                          image: it.customImage,
                                          synopsis: undefined,
                                          genre: [],
                                          platform: undefined,
                                        };
                                    handleGameClick(g);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <img src={img} alt={title} className="w-12 h-12 object-cover border border-border" />
                                      <div className="font-medium">{title}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <Badge variant={statusBadgeVariant(it.status) as any}>{statusLabel(it.status)}</Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{updated}</TableCell>
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
                              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                              <PaginationItem key={idx}>
                                <PaginationLink
                                  href="#"
                                  isActive={safePage === idx + 1}
                                  onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}
                                >
                                  {idx + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>

                    {/* Mobile fallback for table view: vertical list with image, name and status */}
                    <div className="sm:hidden">
                      <div className="flex flex-col gap-2">
                        {sorted.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Nenhum jogo</p>
                        ) : (
                          sorted.map((it: any) => {
                            const title = it.game?.title || it.customTitle || "Jogo";
                            const img = normalize(it.game?.image || it.customImage || null);
                            return (
                              <button
                                key={it.id}
                                className="w-full flex items-center justify-between gap-3 border border-border p-2 text-left hover:border-primary/50 transition-colors"
                                onClick={() => {
                                  const g = it.game
                                    ? {
                                        id: it.game.id,
                                        title: it.game.title,
                                        image: it.game.image,
                                        synopsis: it.game.synopsis,
                                        genre: it.game.genre,
                                        platform: it.game.platform,
                                        igdbId: it.game.igdbId,
                                        storeLinks: it.game.storeLinks,
                                      }
                                    : {
                                        id: it.id,
                                        title: it.customTitle,
                                        image: it.customImage,
                                        synopsis: undefined,
                                        genre: [],
                                        platform: undefined,
                                        storeLinks: it.storeLinks,
                                      };
                                  handleGameClick(g);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <img src={img} alt={title} className="w-12 h-12 object-cover border border-border" />
                                  <div className="text-sm font-medium line-clamp-2">{title}</div>
                                </div>
                                <Badge variant={statusBadgeVariant(it.status) as any}>{statusLabel(it.status)}</Badge>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
          </TabsContent>
        </Tabs>
      </main>

      <GameModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        game={selectedGame}
      />
    </div>
  );
}
