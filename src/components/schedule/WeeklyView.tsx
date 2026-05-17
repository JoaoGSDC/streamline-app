"use client";

import { GameCard } from "@/components/GameCard";

interface WeeklyViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

const daysOfWeek = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export const WeeklyView = ({ games, onGameClick }: WeeklyViewProps) => {
  // Agrupar jogos por dia da semana
  const groupedGames = daysOfWeek.map((day) => ({
    day,
    games: games.filter(
      (game) =>
        game.scheduledTime.toLowerCase().includes(day.toLowerCase()) ||
        game.scheduledTime.toLowerCase().includes("hoje") ||
        game.scheduledTime.toLowerCase().includes("amanhã")
    ),
  }));

  return (
    <div className="space-y-6">
      {groupedGames.map(({ day, games: dayGames }) => (
        <div key={day} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-headline text-body-lg font-semibold text-foreground">{day}</h3>
            <hr className="h-px flex-1 border-0 bg-outline-variant/50" />
            <span className="text-sm text-muted-foreground">
              {dayGames.length} jogo(s)
            </span>
          </div>

          {dayGames.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-4">
              Nenhum jogo agendado
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => onGameClick(game)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
