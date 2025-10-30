"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScheduleForm } from "@/components/ScheduleForm";
import { EnhancedGameModal } from "@/components/EnhancedGameModal";
import { Trash2 } from "lucide-react";
import { StorageService, StreamerService } from "@/services";
import { STORAGE_KEYS } from "@/constants";
import { Streamer } from "@/types";
import Link from "next/link";

interface ScheduledStream {
  id: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string;
  igdbGameId?: number | null;
  gameTitle?: string | null;
  gameImage?: string | null;
  gameSynopsis?: string | null;
  game?: {
    title: string;
    image?: string;
    synopsis?: string;
    genre?: string[];
    platform?: string;
    storeLinks?: Array<{ name: string; url: string }>;
  } | null;
}

export default function Admin() {
  const router = useRouter();
  const { toast } = useToast();
  const [streamer, setStreamer] = useState<any>(null);
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedStream, setSelectedStream] = useState<ScheduledStream | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Tenta obter dados da sessão Twitch
      const twitchSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("twitch_session="))
        ?.split("=")[1];

      if (twitchSession) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(twitchSession));
          setStreamer(sessionData);
          loadStreams(sessionData.id);

          // Persistir no localStorage: adicionar em 'streamers' e setar 'currentStreamer'
          try {
            const streamers =
              StorageService.get<Streamer[]>(STORAGE_KEYS.STREAMERS) || [];

            const exists = streamers.some(
              (s) =>
                s.id === sessionData.id ||
                s.twitchId === sessionData.id ||
                s.twitchUsername === sessionData.twitchUsername
            );

            const streamerItem: Streamer = {
              id: sessionData.id,
              twitchId: sessionData.id,
              name: sessionData.name,
              twitchUsername: sessionData.twitchUsername,
              avatar: sessionData.avatar,
              bio: sessionData.bio,
              twitchUrl: sessionData.twitchUrl,
              followers: sessionData.followers,
              createdAt: new Date(),
            };

            if (!exists) {
              const updated = [...streamers, streamerItem];
              StorageService.set(STORAGE_KEYS.STREAMERS, updated);
            }

            StreamerService.setCurrent(streamerItem);
          } catch (e) {
            console.error("Error persisting Twitch session to localStorage:", e);
          }
        } catch (e) {
          console.error("Error parsing session:", e);
        }
      }

      // Fallback para localStorage (dados antigos)
      const currentStreamer = localStorage.getItem("currentStreamer");
      if (!twitchSession && currentStreamer) {
        const streamerData = JSON.parse(currentStreamer);
        setStreamer(streamerData);
      }

      if (!twitchSession && !currentStreamer) {
        router.push("/auth");
        return;
      }
    }
  }, [router]);

  const loadStreams = async (streamerId: string) => {
    try {
      const response = await fetch(
        `/api/scheduled-streams?streamerId=${streamerId}`
      );
      const data = await response.json();

      if (data.error) {
        toast({
          title: "Erro!",
          description: data.error,
          variant: "destructive",
        });

        return;
      }

      setStreams(data);
    } catch (error) {
      console.error("Error loading streams:", error);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      // Limpar cookie
      document.cookie =
        "twitch_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      localStorage.removeItem("currentStreamer");

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      router.push("/");
    }
  };

  const handleSuccess = () => {
    if (streamer) {
      loadStreams(streamer.id);
      setShowForm(false);
      toast({
        title: "Stream agendada!",
        description: "Sua stream foi agendada com sucesso.",
      });
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    try {
      await fetch(`/api/scheduled-streams/${streamId}`, {
        method: "DELETE",
      });

      setStreams(streams.filter((s) => s.id !== streamId));

      toast({
        title: "Stream removida",
        description: "A stream foi removida da sua agenda.",
      });
    } catch (error) {
      console.error("Error deleting stream:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a stream.",
        variant: "destructive",
      });
    }
  };

  const handleStreamClick = (stream: ScheduledStream) => {
    setSelectedStream(stream);
    setIsModalOpen(true);
  };

  if (!streamer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Painel do Streamer
          </h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Bem-vindo, {streamer.name}!</CardTitle>
            <CardDescription>Gerencie sua agenda de streams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href={`/${streamer.twitchUsername}`} prefetch>
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Minha Agenda Pública
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/admin/games" prefetch>
                  Gerenciar Jogos
                </Link>
              </Button>
              <Button onClick={() => setShowForm(!showForm)} variant="outline">
                {showForm ? "Cancelar" : "Agendar Stream"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle>Agendar Nova Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleForm
                streamerId={streamer.id}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Minhas Streams Agendadas ({streams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {streams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma stream agendada ainda. Agende sua primeira stream!
              </p>
            ) : (
              <div className="space-y-4">
                {streams &&
                  streams?.map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center gap-4 p-4  border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleStreamClick(stream)}
                    >
                      {(() => {
                        const raw = stream.game?.image || stream.gameImage || null;
                        const img = raw
                          ? (() => {
                              const full = raw.startsWith("//") ? `https:${raw}` : raw;
                              let url = full.replace("/t_thumb/", "/t_1080p/");
                              if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
                              return url;
                            })()
                          : null;
                        const title = stream.game?.title || stream.gameTitle || "";
                        if (!img) return null;
                        return (
                          <img
                            src={img}
                            alt={title || "Jogo"}
                            className="w-20 h-20 object-cover rounded"
                          />
                        );
                      })()}
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {stream.game?.title || stream.gameTitle || "Jogo"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(stream.scheduledDate).toLocaleDateString(
                            "pt-BR"
                          )}{" "}
                          • {stream.scheduledTime} • {stream.duration}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStream(stream.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {(() => {
        const streamForModal = selectedStream
          ? {
              ...selectedStream,
              game:
                selectedStream.game ||
                (selectedStream.gameTitle
                  ? {
                      title: selectedStream.gameTitle || "Jogo",
                      image: selectedStream.gameImage || undefined,
                      synopsis: selectedStream.gameSynopsis || undefined,
                    }
                  : null),
            }
          : null;
        return (
          <EnhancedGameModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            streamData={streamForModal as any}
          />
        );
      })()}
    </div>
  );
}
