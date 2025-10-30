"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GameSearch } from "@/components/GameSearch";
import { StorageService, StreamerService } from "@/services";
import { STORAGE_KEYS } from "@/constants";

const STATUS_OPTIONS = [
  { value: "to_play", label: "Para jogar" },
  { value: "playing", label: "Jogando" },
  { value: "finished", label: "Zerados" },
] as const;

type Status = typeof STATUS_OPTIONS[number]["value"];

export default function AdminGames() {
  const router = useRouter();
  const { toast } = useToast();
  const [streamer, setStreamer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const grouped = useMemo(() => {
    return {
      to_play: items.filter((i) => i.status === "to_play"),
      playing: items.filter((i) => i.status === "playing"),
      finished: items.filter((i) => i.status === "finished"),
    };
  }, [items]);

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
            const streamers = StorageService.get<any[]>(STORAGE_KEYS.STREAMERS) || [];
            const exists = streamers.some((s) => s.id === sessionData.id);
            if (!exists) {
              StorageService.set(STORAGE_KEYS.STREAMERS, [...streamers, sessionData]);
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
      const gameRes = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const game = await gameRes.json();
      const sgRes = await fetch("/api/streamer-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamerId: streamer.id, gameId: game.id, status }),
      });
      const sg = await sgRes.json();
      setItems((prev) => [sg, ...prev]);
      toast({ title: "Jogo adicionado", description: `${sel.name} (${labelOf(status)})` });
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível adicionar o jogo", variant: "destructive" });
    }
  }

  async function addCustom(title: string, image: string | undefined, status: Status) {
    try {
      const res = await fetch("/api/streamer-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamerId: streamer.id, customTitle: title, customImage: image || null, status }),
      });
      const sg = await res.json();
      setItems((prev) => [sg, ...prev]);
      toast({ title: "Jogo adicionado", description: `${title} (${labelOf(status)})` });
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível adicionar o jogo", variant: "destructive" });
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
                <label className="text-sm text-muted-foreground">Buscar no IGDB</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1">
                    <GameSearch
                      onGameSelect={async (g) => {
                        await addFromIGDB(g as any, "to_play");
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Adiciona em "Para jogar"</span>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">Adicionar manualmente</label>
                <AddCustomForm onSubmit={addCustom} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Section title="Para jogar" items={grouped.to_play} onRemove={remove} />
        <Section title="Jogando" items={grouped.playing} onRemove={remove} />
        <Section title="Zerados" items={grouped.finished} onRemove={remove} />
      </main>
    </div>
  );
}

function AddCustomForm({ onSubmit }: { onSubmit: (title: string, image: string | undefined, status: Status) => void }) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string>("");
  const [status, setStatus] = useState<Status>("to_play");

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input placeholder="Título do jogo" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="URL da imagem (opcional)" value={image} onChange={(e) => setImage(e.target.value)} />
      <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
        <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

function Section({ title, items, onRemove }: { title: string; items: any[]; onRemove: (id: string) => void }) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>{title} ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum jogo</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((it) => {
              const displayTitle = it.game?.title || it.customTitle || "Jogo";
              const raw = it.game?.image || it.customImage || null;
              const img = raw
                ? (() => {
                    const full = raw.startsWith("//") ? `https:${raw}` : raw;
                    let url = full.replace("/t_thumb/", "/t_720p/");
                    if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
                    return url;
                  })()
                : null;
              return (
                <div key={it.id} className="flex flex-col gap-2 border border-border p-2">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={displayTitle} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-muted" />
                  )}
                  <div className="text-sm font-medium line-clamp-2">{displayTitle}</div>
                  <Button variant="ghost" className="text-destructive px-0 justify-start" onClick={() => onRemove(it.id)}>
                    Remover
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
