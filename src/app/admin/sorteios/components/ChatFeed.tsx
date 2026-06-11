"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./ChatMessage";
import type { RaffleChatMessageRow, RaffleMessageType } from "../types";

export function ChatFeed({
  messages,
  filter,
  className,
}: {
  messages: RaffleChatMessageRow[];
  filter: "all" | "entries" | "chat";
  className?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredMessages = useMemo(() => {
    if (filter === "entries") {
      return messages.filter((m) => m.messageType === "entry");
    }
    if (filter === "chat") {
      return messages.filter((m) => m.messageType !== "system");
    }
    return messages;
  }, [messages, filter]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, autoScroll]);

  return (
    <div
      className={cn("overflow-y-auto px-4 py-2 space-y-1", className)}
      onScroll={(e) => {
        const el = e.currentTarget;
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        setAutoScroll(isAtBottom);
      }}
    >
      {filteredMessages.length === 0 && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          Aguardando mensagens do chat...
        </p>
      )}
      {filteredMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export function ChatFilterRow({
  activeFilter,
  onChange,
}: {
  activeFilter: "all" | "entries" | "chat";
  onChange: (f: "all" | "entries" | "chat") => void;
}) {
  const chips: Array<{ key: "all" | "entries" | "chat"; label: string }> = [
    { key: "all", label: "Todas" },
    { key: "entries", label: "Entradas" },
    { key: "chat", label: "Chat" },
  ];

  return (
    <div className="flex shrink-0 gap-1.5 border-b border-border/30 px-4 py-2">
      {chips.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
            activeFilter === key
              ? "bg-purple-500/15 text-purple-300"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
