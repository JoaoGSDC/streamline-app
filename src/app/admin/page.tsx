"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminChannelOptions,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import { ScheduleForm } from "@/components/ScheduleForm";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { ScheduledStreamCard } from "@/components/admin/schedule/ScheduledStreamCard";
import {
  ScheduleListToolbar,
  type ScheduleViewMode,
} from "@/components/admin/schedule/ScheduleListToolbar";
import {
  ScheduleMiniCalendar,
  isSameCalendarDay,
} from "@/components/admin/schedule/ScheduleMiniCalendar";
import { useAdminSchedulePage } from "@features/schedule/hooks/use-admin-schedule-page.hook";
import { Button } from "@/components/ui/button";

export default function AdminSchedulePage() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    channels,
    userId,
    canModerateOthers,
    resolveFormStreamerId,
  } = useAdminChannelOptions();

  const [viewFilter, setViewFilter] = useState<AdminViewFilter>("mine");
  const [formTarget, setFormTarget] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    () => new Date()
  );

  const {
    editingStream,
    period,
    page,
    streamerLabels,
    filteredStreams,
    totalPages,
    paginatedStreams,
    setPeriod,
    setPage,
    handleSuccess,
    handleEditStream,
    handleCancelEdit,
    handleDeleteStream,
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

  const calendarDayStreams = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return filteredStreams.filter((stream) =>
      isSameCalendarDay(stream.scheduledDate, selectedCalendarDate)
    );
  }, [filteredStreams, selectedCalendarDate]);

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

  const renderStreamCard = (stream: (typeof filteredStreams)[number]) => (
    <ScheduledStreamCard
      key={stream.id}
      stream={stream}
      streamerLabel={
        viewFilter === "all" && stream.streamerId
          ? streamerLabels[stream.streamerId]
          : undefined
      }
      onEdit={() => onEditStream(stream)}
      onDelete={handleDeleteStream}
    />
  );

  if (!ownerChannel && channels.length === 0) return null;

  return (
    <>
      <AdminPageHeader
        title="Agendar Stream"
        description="Planeje transmissões com clareza. Filtre por canal e período para encontrar eventos rapidamente."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <AdminSection
          id="schedule-form"
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
          title="Agenda"
          description="Alterne entre lista e calendário. Clique em um evento para ver detalhes."
          contentClassName="space-y-4"
        >
          <ScheduleListToolbar
            viewFilter={viewFilter}
            onViewFilterChange={(nextFilter) => {
              setViewFilter(nextFilter);
              setPage(1);
            }}
            showChannelFilter={canModerateOthers || channels.length > 1}
            period={period}
            onPeriodChange={(nextPeriod) => {
              setPeriod(nextPeriod);
              setPage(1);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={filteredStreams.length}
          />

          {viewMode === "calendar" ? (
            <>
              <ScheduleMiniCalendar
                streams={filteredStreams}
                month={calendarMonth}
                selectedDate={selectedCalendarDate}
                onMonthChange={setCalendarMonth}
                onSelectDate={setSelectedCalendarDate}
              />

              {selectedCalendarDate ? (
                <div className="space-y-3">
                  <p className="text-body-sm text-muted-foreground">
                    {selectedCalendarDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  {calendarDayStreams.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-outline-variant/30 px-4 py-6 text-center text-sm text-muted-foreground">
                      Nenhuma transmissão neste dia.
                    </p>
                  ) : (
                    calendarDayStreams.map(renderStreamCard)
                  )}
                </div>
              ) : null}
            </>
          ) : filteredStreams.length === 0 ? (
            <AdminEmptyState
              icon={CalendarPlus}
              title="Nenhuma transmissão neste período"
              description="Agende sua próxima live para que viewers saibam quando você estará online."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("schedule-form")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Agendar stream
                </Button>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {paginatedStreams.map(renderStreamCard)}
              </div>

              {totalPages > 1 ? (
                <div className="mt-5 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((currentPage) => Math.max(1, currentPage - 1))
                    }
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
                      setPage((currentPage) =>
                        Math.min(totalPages, currentPage + 1)
                      )
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
    </>
  );
}
