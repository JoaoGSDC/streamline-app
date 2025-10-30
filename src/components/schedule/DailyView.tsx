"use client";

import { GameCard } from "@/components/GameCard";

interface DailyViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const DailyView = ({ games, onGameClick }: DailyViewProps) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const coerceToDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // Interpretar YYYY-MM-DD como data local na meia-noite
        const [y, m, d] = value.split("-").map((v) => parseInt(v, 10));
        return new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      const parsed = new Date(value);
      return isNaN(parsed as any) ? null : parsed;
    }
    const parsed = new Date(value);
    return isNaN(parsed as any) ? null : parsed;
  };

  const todayGames = games.filter((game) => {
    const raw = game?.raw?.scheduledDate;
    const date = coerceToDate(raw);
    if (!date) return false;
    return date >= startOfToday && date <= endOfToday;
  });

  if (todayGames.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum jogo agendado para hoje</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {todayGames.map((game) => (
        <GameCard key={game.id} game={game} onClick={() => onGameClick(game)} />
      ))}
    </div>
  );
};
