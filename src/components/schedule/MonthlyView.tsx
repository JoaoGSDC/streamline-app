import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface MonthlyViewProps {
  games: any[];
  onGameClick: (game: any) => void;
}

export const MonthlyView = ({ games, onGameClick }: MonthlyViewProps) => {
  // Simular um calendário mensal com os jogos
  const weeks = 5;
  const daysInWeek = 7;

  // Agrupar jogos por semana
  const weeksData = Array.from({ length: weeks }, (_, weekIndex) => ({
    weekNumber: weekIndex + 1,
    games: games.slice(weekIndex * 2, (weekIndex + 1) * 2) // 2 jogos por semana para exemplo
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {weeksData.map(({ weekNumber, games: weekGames }) => (
          <div key={weekNumber} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Semana {weekNumber}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {weekGames.length === 0 ? (
                <Card className="col-span-full p-6 text-center border-dashed">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum jogo agendado para esta semana
                  </p>
                </Card>
              ) : (
                weekGames.map((game) => (
                  <Card
                    key={game.id}
                    className="p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                    onClick={() => onGameClick(game)}
                  >
                    <div className="aspect-video w-full mb-3 rounded overflow-hidden">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">{game.title}</h4>
                    <p className="text-xs text-muted-foreground mb-1">{game.scheduledTime}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{game.duration}</span>
                      <span>•</span>
                      <span>{game.platform}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum jogo agendado para este mês
          </p>
        </Card>
      )}
    </div>
  );
};
