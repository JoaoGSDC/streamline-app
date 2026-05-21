"use client";

import { useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminChannelOptions,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import { ScheduleForm } from "@/components/ScheduleForm";
import { EnhancedGameModal } from "@/components/EnhancedGameModal";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { ScheduledStreamCard } from "@/components/admin/schedule/ScheduledStreamCard";
import { ScheduleListToolbar } from "@/components/admin/schedule/ScheduleListToolbar";
import { useAdminSchedulePage } from "@features/schedule/hooks/use-admin-schedule-page.hook";
import { Button } from "@/components/ui/button";

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

  const [viewFilter, setViewFilter] = useState<AdminViewFilter>("mine");
  const [formTarget, setFormTarget] = useState("");

  const {
    selectedStream,
    isModalOpen,
    editingStream,
    period,
    page,
    streamerLabels,
    filteredStreams,
    totalPages,
    paginatedStreams,
    setPeriod,
    setPage,
    setEditingStream,
    handleSuccess,
    handleEditStream,
    handleCancelEdit,
    handleDeleteStream,
    handleStreamClick,
    handleCloseModal,
  } = useAdminSchedulePage({
    channels,
    userId,
    viewFilter,
    formTarget,
    resolveFormStreamerId,
    onLoadError: () => {
      toast({
        title: "Erro!",
        description: "Não foi possível carregar a agenda.",
        variant: "destructive",
      });
    },
    onDeleteSuccess: () => {
      toast({
        title: "Stream removida",
        description: "A stream foi removida da agenda.",
      });
    },
    onDeleteError: () => {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a stream.",
        variant: "destructive",
      });
    },
  });

  const onFormSuccess = () => {
    const wasEditing = handleSuccess();
    toast({
      title: wasEditing ? "Agenda atualizada!" : "Stream agendada!",
      description: wasEditing
        ? "As alterações foram salvas com sucesso."
        : "Sua stream foi agendada com sucesso.",
    });
  };

  const onEditStream = (stream: Parameters<typeof handleEditStream>[0]) => {
    handleEditStream(stream);
    if (stream.streamerId) {
      setFormTarget(stream.streamerId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          title={editingStream ? "Editar transmissão" : "Nova transmissão"}
          description={
            editingStream
              ? "Altere data, horário, jogo ou qualquer outro campo e salve."
              : "Busque o jogo, defina data e horário. Leva menos de um minuto."
          }
        >
          <ScheduleForm
            formTarget={formTarget}
            onFormTargetChange={setFormTarget}
            ownerChannel={ownerChannel}
            moderatedChannels={moderatedChannels}
            resolveStreamerId={resolveFormStreamerId}
            editingStream={editingStream}
            onCancelEdit={handleCancelEdit}
            onSuccess={onFormSuccess}
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
            onPeriodChange={(nextPeriod) => {
              setPeriod(nextPeriod);
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
                    onEdit={() => onEditStream(stream)}
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
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
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
                    onClick={() =>
                      setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                    }
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
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        onEdit={
          selectedStream ? () => onEditStream(selectedStream) : undefined
        }
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
