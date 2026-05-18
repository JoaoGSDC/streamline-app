"use client";

import { GameCard } from "@/components/GameCard";
import { getGamesGroupedByWeekDay } from "@/lib/schedule-dates";

interface WeeklyViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const WeeklyView = ({ games, onGameClick }: WeeklyViewProps) => {
  const groupedGames = getGamesGroupedByWeekDay(games);

  return (
    <div className="space-y-6">
      {groupedGames.map(({ day, games: dayGames }) => (
        <div key={day} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-headline text-body-lg font-semibold text-foreground">
              {day}
            </h3>
            <hr className="h-px flex-1 border-0 bg-outline-variant/50" />
            <span className="text-sm text-muted-foreground">
              {dayGames.length} jogo(s)
            </span>
          </div>

          {dayGames.length === 0 ? (
            <p className="pl-4 text-sm text-muted-foreground">
              Nenhum jogo agendado
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
