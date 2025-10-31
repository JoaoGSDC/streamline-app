"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GameSearch } from "@/components/GameSearch";
import { StorageService, StreamerService } from "@/services";
import { STORAGE_KEYS } from "@/constants";

const STATUS_OPTIONS = [
  { value: "to_play", label: "Para jogar" },
  { value: "playing", label: "Jogando" },
  { value: "finished", label: "Concluídos" },
  { value: "dropped", label: "Droppados" },
] as const;

type Status = (typeof STATUS_OPTIONS)[number]["value"];

export default function AdminGames() {
  const router = useRouter();
  const { toast } = useToast();
  const [streamer, setStreamer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const grouped = useMemo(() => {
    const byStatus = {
      to_play: items.filter((i) => i.status === "to_play"),
      playing: items.filter((i) => i.status === "playing"),
      finished: items.filter((i) => i.status === "finished"),
      dropped: items.filter((i) => i.status === "dropped"),
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
  }, [items]);

  function normalizeImageUrl(raw?: string | null) {
    if (!raw) {
      return "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
    }
    const full = raw.startsWith("//") ? `https:${raw}` : raw;
    let url = full.replace("/t_thumb/", "/t_720p/");
    if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
    return url;
  }

  async function reindexColumn(columnKey: KanbanColumnKey, orderedIds: string[]) {
    // atribuir sortOrder em passos de 10
    const updates = orderedIds.map((gid, idx) => ({ id: gid, sortOrder: (idx + 1) * 10 }));
    try {
      for (const up of updates) {
        await fetch(`/api/streamer-games/${up.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: columnKey, sortOrder: up.sortOrder }),
        });
      }
      setItems((prev) =>
        prev.map((it) =>
          orderedIds.includes(it.id)
            ? { ...it, status: columnKey, sortOrder: updates.find((u) => u.id === it.id)!.sortOrder }
            : it
        )
      );
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível salvar a ordem", variant: "destructive" });
    }
  }

  function handleDropAt(columnKey: KanbanColumnKey, beforeId: string | null, draggedId: string) {
    const colItems = grouped[columnKey];
    const remaining = colItems.filter((it) => it.id !== draggedId).map((it) => it.id);
    const insertIndex = beforeId ? Math.max(0, remaining.indexOf(beforeId)) : remaining.length;
    const newOrderIds = [...remaining.slice(0, insertIndex), draggedId, ...remaining.slice(insertIndex)];
    reindexColumn(columnKey, newOrderIds);
  }

  async function moveItem(id: string, newStatus: Status) {
    try {
      await fetch(`/api/streamer-games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível mover o card", variant: "destructive" });
    }
  }

  async function updateNotes(id: string, notes: string) {
    try {
      await fetch(`/api/streamer-games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
      toast({ title: "Observação salva" });
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível salvar a observação", variant: "destructive" });
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const twitchSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("twitch_session="))
        ?.split("=")[1];

      if (twitchSession) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(twitchSession));
          setStreamer(sessionData);
          load(sessionData.id);
          try {
            const streamers =
              StorageService.get<any[]>(STORAGE_KEYS.STREAMERS) || [];
            const exists = streamers.some((s) => s.id === sessionData.id);
            if (!exists) {
              StorageService.set(STORAGE_KEYS.STREAMERS, [
                ...streamers,
                sessionData,
              ]);
            }
            StreamerService.setCurrent(sessionData);
          } catch {}
        } catch {}
      } else {
        const currentStreamer = localStorage.getItem("currentStreamer");
        if (!currentStreamer) {
          router.push("/auth");
          return;
        }
        const streamerData = JSON.parse(currentStreamer);
        setStreamer(streamerData);
        load(streamerData.id);
      }
    }
  }, [router]);

  async function load(streamerId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/streamer-games?streamerId=${streamerId}`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function addFromIGDB(sel: any, status: Status) {
    try {
      // create or reuse game base
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
          streamerId: streamer.id,
          gameId: game.id,
          status,
        }),
      });
      const sg = await sgRes.json();
      setItems((prev) => [sg, ...prev]);
      toast({
        title: "Jogo adicionado",
        description: `${sel.name} (${labelOf(status)})`,
      });
    } catch (e) {
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
    status: Status
  ) {
    try {
      const res = await fetch("/api/streamer-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerId: streamer.id,
          customTitle: title,
          customImage: image || null,
          status,
        }),
      });
      const sg = await res.json();
      setItems((prev) => [sg, ...prev]);
      toast({
        title: "Jogo adicionado",
        description: `${title} (${labelOf(status)})`,
      });
    } catch (e) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o jogo",
        variant: "destructive",
      });
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/streamer-games/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Removido" });
    } catch {}
  }

  function labelOf(status: Status) {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
  }

  if (!streamer) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Meus Jogos
          </h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href={`/${streamer.twitchUsername}`} prefetch>
                Ver Página Pública
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Adicionar Jogo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">
                  Buscar no IGDB
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1">
                    <GameSearch
                      onGameSelect={async (g) => {
                        await addFromIGDB(g as any, "to_play");
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Adiciona em &quot;Para jogar&quot;
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">
                  Adicionar manualmente
                </label>
                <AddCustomForm onSubmit={addCustom} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Kanban
          columns={[
            { key: "to_play", title: "Para jogar", items: grouped.to_play },
            { key: "playing", title: "Jogando", items: grouped.playing },
            { key: "finished", title: "Concluídos", items: grouped.finished },
            { key: "dropped", title: "Droppados", items: grouped.dropped },
          ]}
          onDropItem={moveItem}
          onDropAt={handleDropAt}
          onRemove={remove}
          onSaveNotes={updateNotes}
          normalizeImageUrl={normalizeImageUrl}
        />
      </main>
    </div>
  );
}

function AddCustomForm({
  onSubmit,
}: {
  onSubmit: (title: string, image: string | undefined, status: Status) => void;
}) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string>("");
  const [status, setStatus] = useState<Status>("to_play");

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder="Título do jogo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="URL da imagem (opcional)"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />
      <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
        <SelectTrigger className="min-w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={() => {
          if (!title.trim()) return;
          onSubmit(title.trim(), image?.trim() || undefined, status);
          setTitle("");
          setImage("");
          setStatus("to_play");
        }}
      >
        Adicionar
      </Button>
    </div>
  );
}

type KanbanColumnKey = "to_play" | "playing" | "finished" | "dropped";

function Kanban({
  columns,
  onDropItem,
  onDropAt,
  onRemove,
  onSaveNotes,
  normalizeImageUrl,
}: {
  columns: { key: KanbanColumnKey; title: string; items: any[] }[];
  onDropItem: (id: string, newStatus: KanbanColumnKey) => void;
  onDropAt: (columnKey: KanbanColumnKey, beforeId: string | null, draggedId: string) => void;
  onRemove: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  normalizeImageUrl: (raw?: string | null) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div
          key={col.key}
          className="border border-border min-h-[280px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain");
            // drop ao fim da coluna (append)
            if (id) onDropAt(col.key, null, id);
          }}
        >
          <div className="px-4 py-3 border-b border-border bg-muted/40 font-semibold">
            {col.title} ({col.items.length})
          </div>
          <div className="p-3 grid grid-cols-2 lg:grid-cols-1 gap-3">
            {col.items.length === 0 && (
              <p className="text-muted-foreground text-sm">Nenhum jogo</p>
            )}
            {col.items.map((it, idx) => (
              <div key={it.id} className="flex flex-col gap-2">
                {/* dropzone antes do card */}
                <div
                  className="h-2 border border-dashed border-transparent hover:border-primary/40"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) onDropAt(col.key, it.id, id);
                  }}
                />
                <KanbanCard
                  item={it}
                  onRemove={onRemove}
                  onSaveNotes={onSaveNotes}
                  normalizeImageUrl={normalizeImageUrl}
                />
              </div>
            ))}
            {/* dropzone ao final da coluna */}
            <div
              className="h-3 border border-dashed border-transparent hover:border-primary/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) onDropAt(col.key, null, id);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanCard({
  item,
  onRemove,
  onSaveNotes,
  normalizeImageUrl,
}: {
  item: any;
  onRemove: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  normalizeImageUrl: (raw?: string | null) => string;
}) {
  const [notes, setNotes] = useState<string>(item.notes || "");
  const displayTitle = item.game?.title || item.customTitle || "Jogo";
  const img = normalizeImageUrl(item.game?.image || item.customImage || null);
  return (
    <div
      className="flex flex-col gap-2 border border-border p-2 bg-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={displayTitle} className="w-full h-28 object-cover" />
      <div className="text-sm font-medium line-clamp-2">{displayTitle}</div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observação (opcional)"
        className="min-h-16 text-sm p-2 border border-border bg-background outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => onSaveNotes(item.id, notes)}>
          Salvar
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onRemove(item.id)}>
          Remover
        </Button>
      </div>
    </div>
  );
}
