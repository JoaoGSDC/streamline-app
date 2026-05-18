"use client";

import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { GameCard } from "@/components/GameCard";
import { getGamesForDay, getGamesForMonth } from "@/lib/schedule-dates";
import { ptBR } from "date-fns/locale";

interface CalendarViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const CalendarView = ({ games, onGameClick }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const gamesForSelectedDate = useMemo(
    () => (selectedDate ? getGamesForDay(games, selectedDate) : []),
    [games, selectedDate]
  );

  const gamesForMonth = useMemo(
    () => (selectedDate ? getGamesForMonth(games, selectedDate) : []),
    [games, selectedDate]
  );

  const monthTitle = selectedDate
    ? selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "este mês";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex w-full shrink-0 justify-center lg:w-auto lg:justify-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="glass-panel w-full rounded-lg border border-outline-variant/30 !shadow-none sm:w-auto"
          />
        </div>

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gamesForSelectedDate.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => onGameClick(game)}
                />
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

      <div className="mt-8">
        <h3 className="mb-4 text-xl font-bold capitalize">
          Todos os jogos de {monthTitle}
        </h3>
        {gamesForMonth.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gamesForMonth.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => onGameClick(game)}
              />
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
