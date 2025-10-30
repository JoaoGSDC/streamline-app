import { useState, useEffect, useCallback } from "react";
import { Game } from "@/types";
import { GameService } from "@/services";

export const useGames = (streamerId?: string) => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGames = () => {
      try {
        const allGames = GameService.getAll();
        const filteredGames = streamerId
          ? allGames.filter((g) => g.streamerId === streamerId)
          : allGames;
        setGames(filteredGames);
      } catch (error) {
        console.error("Error loading games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, [streamerId]);

  const addGame = useCallback((gameData: any, streamerId: string) => {
    try {
      const newGame = GameService.create(gameData, streamerId);
      setGames((prev) => [...prev, newGame]);
      return newGame;
    } catch (error) {
      console.error("Error adding game:", error);
      throw error;
    }
  }, []);

  const removeGame = useCallback((gameId: string) => {
    try {
      GameService.delete(gameId);
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    } catch (error) {
      console.error("Error removing game:", error);
      throw error;
    }
  }, []);

  return {
    games,
    isLoading,
    addGame,
    removeGame,
  };
};
