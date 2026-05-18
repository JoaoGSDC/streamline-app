"use client";

import { useState } from "react";
import { ViewToggle, ViewType } from "@/components/ViewToggle";
import { DailyView } from "@/components/schedule/DailyView";
import { WeeklyView } from "@/components/schedule/WeeklyView";
import { CalendarView } from "@/components/schedule/CalendarView";
import { TabsContent } from "@/components/ui/tabs";
import { useStreamerProfile } from "@/contexts/StreamerProfileContext";

export function StreamerAgendaPanel() {
  const { scheduleGames, loadingSchedule, streamer, loadingStreamer, openGame } =
    useStreamerProfile();
  const [currentView, setCurrentView] = useState<ViewType>("daily");

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

  const isLoading = !streamer || loadingStreamer || loadingSchedule;

  return (
    <TabsContent value="agenda" className="mt-0" forceMount>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-headline text-headline-lg text-foreground">
          {getViewTitle()}
        </h2>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {currentView === "daily" && (
            <DailyView games={scheduleGames} onGameClick={openGame} />
          )}
          {currentView === "weekly" && (
            <WeeklyView games={scheduleGames} onGameClick={openGame} />
          )}
          {currentView === "monthly" && (
            <CalendarView games={scheduleGames} onGameClick={openGame} />
          )}
        </>
      )}
    </TabsContent>
  );
}
