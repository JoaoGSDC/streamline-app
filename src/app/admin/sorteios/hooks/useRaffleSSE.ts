"use client";

import { useEffect, useRef, useState } from "react";
import type { RaffleChatMessageRow, RaffleConfig, RaffleWinnerRow } from "../types";
import { raffles } from "@services/entities/raffles.services";

export function useRaffleSSE(
  raffleId: string | undefined,
  onSnapshot?: (data: RaffleConfig) => void
) {
  const [messages, setMessages] = useState<RaffleChatMessageRow[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [winnerDrawn, setWinnerDrawn] = useState<RaffleWinnerRow | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!raffleId) {
      setMessages([]);
      setLiveCount(0);
      setConnectionStatus("disconnected");
      return;
    }

    let es: EventSource | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      setConnectionStatus("connecting");
      es = new EventSource(raffles.streamUrl(raffleId));

      es.addEventListener("snapshot", (e) => {
        const data = JSON.parse(e.data) as RaffleConfig;
        setMessages(data.recentMessages ?? []);
        setLiveCount(data.entriesCount ?? 0);
        onSnapshot?.(data);
      });

      es.addEventListener("messages", (e) => {
        const newMsgs = JSON.parse(e.data) as RaffleChatMessageRow[];
        setMessages((prev) => [...prev.slice(-200), ...newMsgs]);
      });

      es.addEventListener("entries_added", (e) => {
        const entries = JSON.parse(e.data) as unknown[];
        setLiveCount((prev) => prev + entries.length);
      });

      es.addEventListener("entry_count", (e) => {
        setLiveCount(JSON.parse(e.data) as number);
      });

      es.addEventListener("status_changed", () => {
        // snapshot event follows with full state
      });

      es.addEventListener("winner_drawn", (e) => {
        setWinnerDrawn(JSON.parse(e.data) as RaffleWinnerRow);
      });

      es.onopen = () => setConnectionStatus("connected");
      es.onerror = () => {
        setConnectionStatus("disconnected");
        es?.close();
        if (!closed) {
          retryRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      es?.close();
    };
  }, [raffleId, onSnapshot]);

  return { messages, liveCount, winnerDrawn, connectionStatus };
}
