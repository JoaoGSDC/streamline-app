import { GameCard } from "@/components/GameCard";

interface DailyViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const DailyView = ({ games, onGameClick }: DailyViewProps) => {
  // Filtrar jogos de hoje
  const todayGames = games.filter(game => 
    game.scheduledTime.toLowerCase().includes("hoje")
  );

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
        <GameCard
          key={game.id}
          title={game.title}
          image={game.image}
          scheduledTime={game.scheduledTime}
          duration={game.duration}
          platform={game.platform}
          onClick={() => onGameClick(game)}
        />
      ))}
    </div>
  );
};
