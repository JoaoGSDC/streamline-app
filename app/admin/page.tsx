"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminChannelOptions,
  resolveStreamerIdsForFilter,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import { fetchMergedByStreamerIds } from "@/lib/admin-fetch";
import { ScheduleForm } from "@/components/ScheduleForm";
import { EnhancedGameModal } from "@/components/EnhancedGameModal";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import {
  ScheduledStreamCard,
  type ScheduledStreamItem,
} from "@/components/admin/schedule/ScheduledStreamCard";
import { ScheduleListToolbar } from "@/components/admin/schedule/ScheduleListToolbar";
import {
  filterStreamsByDateRange,
  getDefaultSchedulePeriod,
} from "@/lib/schedule-period";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

interface ScheduledStream extends ScheduledStreamItem {
  streamerId?: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string;
  igdbGameId?: number | null;
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

export default function AdminSchedulePage() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    viewFilterOptions,
    resolveFormStreamerId,
    channels,
    userId,
  } = useAdminChannelOptions();

  const channelKey = useMemo(
    () => channels.map((c) => c.id).sort().join(","),
    [channels]
  );

  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<ScheduledStream | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<AdminViewFilter>("mine");
  const [formTarget, setFormTarget] = useState("");
  const [period, setPeriod] = useState(getDefaultSchedulePeriod);
  const [page, setPage] = useState(1);

  const streamerLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of channels) {
      map[c.id] = c.twitchUsername;
    }
    return map;
  }, [channels]);

  useEffect(() => {
    if (!channelKey) return;

    let cancelled = false;

    (async () => {
      try {
        const ids = resolveStreamerIdsForFilter(viewFilter, channels, userId);
        const data = await fetchMergedByStreamerIds<ScheduledStream>(
          ids,
          (id) => `/api/scheduled-streams?streamerId=${id}`
        );
        data.sort(
          (a, b) =>
            new Date(a.scheduledDate).getTime() -
            new Date(b.scheduledDate).getTime()
        );
        if (!cancelled) {
          setStreams(data);
          setPage(1);
        }
      } catch (error) {
        console.error("Error loading streams:", error);
        if (!cancelled) {
          toast({
            title: "Erro!",
            description: "Não foi possível carregar a agenda.",
            variant: "destructive",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewFilter, channelKey, userId]);

  const filteredStreams = useMemo(() => {
    return filterStreamsByDateRange(streams, period);
  }, [streams, period]);

  const totalPages = Math.max(1, Math.ceil(filteredStreams.length / PAGE_SIZE));

  const paginatedStreams = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStreams.slice(start, start + PAGE_SIZE);
  }, [filteredStreams, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const reloadStreams = useCallback(async () => {
    const ids = resolveStreamerIdsForFilter(viewFilter, channels, userId);
    const data = await fetchMergedByStreamerIds<ScheduledStream>(
      ids,
      (id) => `/api/scheduled-streams?streamerId=${id}`
    );
    data.sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
    setStreams(data);
    setPage(1);
  }, [viewFilter, channels, userId]);

  const handleSuccess = () => {
    void reloadStreams();
    toast({
      title: "Stream agendada!",
      description: "Sua stream foi agendada com sucesso.",
    });
  };

  const handleDeleteStream = async (streamId: string) => {
    try {
      const res = await fetch(`/api/scheduled-streams/${streamId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setStreams((prev) => prev.filter((s) => s.id !== streamId));

      toast({
        title: "Stream removida",
        description: "A stream foi removida da agenda.",
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

  if (!ownerChannel && channels.length === 0) return null;

  return (
    <>
      <AdminPageHeader
        title="Agendar Stream"
        description="Planeje transmissões com clareza. Filtre por canal e período para encontrar eventos rapidamente."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <AdminSection
          title="Nova transmissão"
          description="Busque o jogo, defina data e horário. Leva menos de um minuto."
        >
          <ScheduleForm
            formTarget={formTarget}
            onFormTargetChange={setFormTarget}
            ownerChannel={ownerChannel}
            moderatedChannels={moderatedChannels}
            resolveStreamerId={resolveFormStreamerId}
            onSuccess={handleSuccess}
          />
        </AdminSection>

        <AdminSection
          title={`Agenda (${filteredStreams.length})`}
          description="Clique em um evento para ver detalhes. Use filtros para navegar entre canais e datas."
          contentClassName="space-y-4"
        >
          <ScheduleListToolbar
            viewFilter={viewFilter}
            onViewFilterChange={setViewFilter}
            viewFilterOptions={viewFilterOptions}
            period={period}
            onPeriodChange={(p) => {
              setPeriod(p);
              setPage(1);
            }}
          />

          {filteredStreams.length === 0 ? (
            <AdminEmptyState
              icon={CalendarPlus}
              title="Nenhuma stream neste filtro"
              description="Ajuste o período ou o canal exibido, ou crie uma nova transmissão ao lado."
            />
          ) : (
            <>
              <div className="space-y-3">
                {paginatedStreams.map((stream) => (
                  <ScheduledStreamCard
                    key={stream.id}
                    stream={stream}
                    streamerLabel={
                      viewFilter === "all" && stream.streamerId
                        ? streamerLabels[stream.streamerId]
                        : undefined
                    }
                    onClick={() => handleStreamClick(stream)}
                    onDelete={handleDeleteStream}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center justify-between gap-2 border-t border-outline-variant/25 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-body-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Próxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </AdminSection>
      </div>

      <EnhancedGameModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        streamData={
          selectedStream
            ? {
                ...selectedStream,
                scheduledDate: new Date(selectedStream.scheduledDate),
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
            : null
        }
      />
    </>
  );
}
