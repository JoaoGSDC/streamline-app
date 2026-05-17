"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { GameCard } from "@/components/GameCard";
import { isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const CalendarView = ({ games, onGameClick }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Função para agrupar jogos por data
  const getGamesForDate = (date: Date) => {
    return games.filter((game) => {
      if (!game.raw?.scheduledDate) return false;
      try {
        const gameDate = parseISO(game.raw.scheduledDate);
        return isSameDay(gameDate, date);
      } catch (e) {
        return false;
      }
    });
  };

  // Obter jogos para a data selecionada
  const gamesForSelectedDate = selectedDate
    ? getGamesForDate(selectedDate)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Componente de calendário */}
        <div className="flex w-full shrink-0 justify-center lg:w-auto lg:justify-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="glass-panel w-full rounded-lg border border-outline-variant/30 !shadow-none sm:w-auto"
          />
        </div>

        {/* Lista de jogos para a data selecionada */}
        <div className="flex min-w-0 w-full flex-1 flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold">
              {selectedDate
                ? selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Selecione uma data"}
            </h3>
            <p className="text-muted-foreground">
              {gamesForSelectedDate.length} jogo(s) agendado(s) para esta data
            </p>
          </div>

          {gamesForSelectedDate.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamesForSelectedDate.map((game) => (
                <div key={game.id} onClick={() => onGameClick(game)}>
                  <GameCard
                    game={{
                      ...game,
                      id: game.id,
                      title: game.title,
                      image: game.image,
                      scheduledTime: game.scheduledTime,
                      duration: game.duration,
                      platform: game.platform,
                      synopsis: game.synopsis,
                      streamUrl: game.streamUrl,
                    }}
                    onClick={() => onGameClick(game)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="w-full p-8 text-center lg:min-h-[280px] lg:flex lg:items-center lg:justify-center">
              <p className="text-muted-foreground">
                Nenhum jogo agendado para esta data
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Mostrar todos os jogos do mês abaixo do calendário */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Todos os jogos deste mês</h3>
        {games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div key={game.id} onClick={() => onGameClick(game)}>
                <GameCard
                  game={{
                    ...game,
                    id: game.id,
                    title: game.title,
                    image: game.image,
                    scheduledTime: game.scheduledTime,
                    duration: game.duration,
                    platform: game.platform,
                    synopsis: game.synopsis,
                    streamUrl: game.streamUrl,
                  }}
                  onClick={() => onGameClick(game)}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum jogo agendado para este mês
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
