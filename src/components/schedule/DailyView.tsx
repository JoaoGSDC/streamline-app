"use client";

import { GameCard } from "@/components/GameCard";
import { getGamesForDay } from "@/lib/schedule-dates";

interface DailyViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const DailyView = ({ games, onGameClick }: DailyViewProps) => {
  const todayGames = getGamesForDay(games, new Date());

  if (todayGames.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Nenhum jogo agendado para hoje</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {todayGames.map((game) => (
        <GameCard key={game.id} game={game} onClick={() => onGameClick(game)} />
      ))}
    </div>
  );
};
