import { useState, useEffect, useCallback } from "react";
import { ScheduledStream } from "@/types";
import { ScheduledStreamService } from "@/services";

export const useScheduledStreams = (streamerId?: string) => {
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreams = () => {
      try {
        const allStreams = ScheduledStreamService.getAll();
        const filteredStreams = streamerId
          ? allStreams.filter((s) => s.streamerId === streamerId)
          : allStreams;
        setStreams(filteredStreams);
      } catch (error) {
        console.error("Error loading streams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreams();
  }, [streamerId]);

  const addStream = useCallback((streamData: Partial<ScheduledStream>) => {
    try {
      const newStream = ScheduledStreamService.create(streamData);
      setStreams((prev) => [...prev, newStream]);
      return newStream;
    } catch (error) {
      console.error("Error adding stream:", error);
      throw error;
    }
  }, []);

  const removeStream = useCallback((streamId: string) => {
    try {
      ScheduledStreamService.delete(streamId);
      setStreams((prev) => prev.filter((s) => s.id !== streamId));
    } catch (error) {
      console.error("Error removing stream:", error);
      throw error;
    }
  }, []);

  return {
    streams,
    isLoading,
    addStream,
    removeStream,
  };
};
