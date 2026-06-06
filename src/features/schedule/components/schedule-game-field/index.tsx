"use client";

import { X } from "lucide-react";
import { GameSearch } from "@features/search/components/game-search";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { createImageUrlFormatter } from "@utils/factories/create-image-url-formatter";
import type { ScheduleSelectedGame } from "@features/schedule/types/schedule.types";
import { useRecentBoardGames } from "@features/schedule/hooks/use-recent-board-games.hook";

const formatImageUrl = createImageUrlFormatter();

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";

function coverSrc(game: ScheduleSelectedGame): string {
  if (!game.cover?.url) return FALLBACK_COVER;
  const raw = game.cover.url;
  if (raw.startsWith("http")) return raw;
  return formatImageUrl(raw);
}

interface ScheduleGameFieldProps {
  streamerId: string;
  selectedGame: ScheduleSelectedGame | null;
  isCustomGame: boolean;
  customGameTitle: string;
  onGameSelect: (game: ScheduleSelectedGame) => void;
  onClearGame: () => void;
  onCustomTitleChange: (value: string) => void;
  onUseCustomGame: () => void;
  onUseIgdbSearch: () => void;
}

export function ScheduleGameField({
  streamerId,
  selectedGame,
  isCustomGame,
  customGameTitle,
  onGameSelect,
  onClearGame,
  onCustomTitleChange,
  onUseCustomGame,
  onUseIgdbSearch,
}: ScheduleGameFieldProps) {
  const recentGames = useRecentBoardGames(streamerId);

  const handleBoardPick = (game: ScheduleSelectedGame) => {
    if (game.id < 0) {
      onUseCustomGame();
      onCustomTitleChange(game.name);
      return;
    }
    onGameSelect(game);
  };

  if (!isCustomGame && selectedGame) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-low/50 px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc(selectedGame)}
          alt=""
          className="h-11 w-8 shrink-0 rounded object-cover"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {selectedGame.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClearGame}
          aria-label="Limpar jogo selecionado"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isCustomGame) {
    return (
      <div className="space-y-2">
        <Input
          placeholder="Nome do jogo"
          value={customGameTitle}
          onChange={(event) => onCustomTitleChange(event.target.value)}
          required
          className="input-cinematic"
        />
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={onUseIgdbSearch}
        >
          Ou buscar na IGDB
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <GameSearch
        variant="compact"
        recentSuggestions={recentGames}
        onGameSelect={handleBoardPick}
        placeholder="Buscar jogo na IGDB…"
      />
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto px-0 text-muted-foreground"
        onClick={onUseCustomGame}
      >
        Usar nome customizado
      </Button>
    </div>
  );
}
