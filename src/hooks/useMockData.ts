import { useState, useEffect } from "react";
import { StreamerService, GameService } from "@/services";

export const useMockData = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeData = () => {
      try {
        StreamerService.initializeMockData();
        GameService.initializeMockData();
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing mock data:", error);
      }
    };

    initializeData();
  }, []);

  return { isInitialized };
};
