"use client";

import { cn } from "@/lib/utils";
import { TwitchAvatar } from "./TwitchAvatar";
import type { RaffleChatMessageRow } from "../types";

const typeStyles: Record<string, string> = {
  entry: "text-purple-300",
  system: "text-green-400",
  winner_response: "text-amber-300 font-medium",
  confirmation: "text-green-400 font-medium",
  chat: "text-muted-foreground",
};

export function ChatMessage({
  message,
  variant = "default",
}: {
  message: RaffleChatMessageRow;
  variant?: "default" | "winner";
}) {
  return (
    <div className="group flex items-baseline gap-2 text-sm leading-relaxed">
      <TwitchAvatar login={message.twitchLogin} size={18} className="mt-0.5 shrink-0" />
      <span
        className={cn(
          "shrink-0 text-xs font-medium",
          variant === "winner" ? "text-amber-400" : "text-purple-400"
        )}
      >
        {message.displayName}
      </span>
      <span className={cn("text-xs", typeStyles[message.messageType] ?? "text-foreground")}>
        {message.message}
      </span>
      {message.messageType === "entry" && (
        <span className="shrink-0 rounded border border-purple-500/20 bg-purple-500/15 px-1 text-[10px] text-purple-400">
          ✓ entrou
        </span>
      )}
    </div>
  );
}
