"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Shuffle,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatFeed, ChatFilterRow } from "./ChatFeed";
import { ChatMessage } from "./ChatMessage";
import { TwitchAvatar } from "./TwitchAvatar";
import { useRaffleSSE } from "../hooks/useRaffleSSE";
import type { RaffleConfig } from "../types";
import type { RaffleStateActions, RaffleUiState } from "../hooks/useRaffleState";

function FeedEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
        <Trophy className="h-7 w-7 text-purple-400" />
      </div>
      <p className="text-sm text-muted-foreground">
        Configure o sorteio à esquerda e clique em <strong>Iniciar sorteio</strong>.
      </p>
    </div>
  );
}

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function WinnerRevealSection({
  raffle,
  actions,
}: {
  raffle: RaffleConfig;
  actions: RaffleStateActions;
}) {
  const [activeWinner, setActiveWinner] = useState(0);
  const winners = raffle.winners.filter((w) => w.status !== "rerolled");
  const winner = winners[activeWinner];
  const winnerMessages = winner?.twitchUserId
    ? (raffle.winnerMessages[winner.twitchUserId] ?? [])
    : [];

  if (!winner) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Sorteando...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {winners.length > 1 && (
        <div className="flex shrink-0 gap-1 border-b border-border/30 px-4 py-2">
          {winners.map((w, i) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setActiveWinner(i)}
              className={cn(
                "rounded px-2 py-0.5 text-xs",
                i === activeWinner ? "bg-purple-500/15 text-purple-300" : "text-muted-foreground"
              )}
            >
              {i + 1}º
            </button>
          ))}
        </div>
      )}

      <div className="mx-4 mt-4 rounded-xl border border-purple-500/25 bg-purple-500/8 p-5 text-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Trophy className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
          {winners.length > 1 ? `${activeWinner + 1}º lugar` : "Vencedor"}
        </div>
        <TwitchAvatar login={winner.twitchLogin ?? ""} size={52} className="mx-auto mb-3" />
        <div className="mb-1 font-mono text-xl font-semibold text-purple-300">
          @{winner.twitchLogin}
        </div>
        <div className="text-xs text-muted-foreground">
          {raffle.entriesCount} participantes · sorteado às {formatTime(winner.drawnAt)}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => actions.reroll(winner.id)}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Re-rolar
          </Button>
          {winner.status === "pending" && (
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => actions.confirmWinner(winner.id)}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Confirmar
            </Button>
          )}
          {winner.status === "confirmed" && (
            <div className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Confirmado
            </div>
          )}
        </div>
      </div>

      <div className="mx-4 mt-4 flex-1">
        <div className="mb-3 border-b border-border/30 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
          Mensagens de @{winner.twitchLogin}
        </div>
        <div className="space-y-2">
          {winnerMessages.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Aguardando mensagens do vencedor...
            </p>
          )}
          {winnerMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} variant="winner" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadyToDrawSection({
  raffle,
  actions,
}: {
  raffle: RaffleConfig;
  actions: RaffleStateActions;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
        <Shuffle className="h-8 w-8 text-purple-400" />
      </div>
      <div className="text-center">
        <div className="mb-1 text-2xl font-semibold tabular-nums text-purple-300">
          {raffle.entriesCount}
        </div>
        <div className="text-sm text-muted-foreground">participantes inscritos</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Pronto para sortear {raffle.winnerCount} vencedor(es)
        </div>
      </div>
      <Button
        size="lg"
        className="bg-purple-600 px-8 text-white hover:bg-purple-700"
        onClick={actions.draw}
      >
        <Zap className="mr-2 h-4 w-4" />
        Sortear agora
      </Button>
      <button
        type="button"
        onClick={actions.reopen}
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Reabrir entradas
      </button>
    </div>
  );
}

export function RaffleFeed({
  raffle,
  state,
  actions,
}: {
  raffle: RaffleConfig | null;
  state: RaffleUiState;
  actions: RaffleStateActions;
}) {
  const { messages, liveCount } = useRaffleSSE(
    raffle && !["draft", "cancelled"].includes(raffle.status) ? raffle.id : undefined,
    (snapshot) => actions.setRaffle(snapshot)
  );

  if (!raffle || raffle.status === "draft") {
    return <FeedEmptyState />;
  }

  if (raffle.status === "completed" || raffle.status === "drawing") {
    return <WinnerRevealSection raffle={raffle} actions={actions} />;
  }

  if (raffle.status === "closed") {
    return <ReadyToDrawSection raffle={raffle} actions={actions} />;
  }

  const count = liveCount || raffle.entriesCount;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/30 bg-muted/20 px-4 py-2.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            raffle.status === "active" ? "bg-green-500" : "bg-amber-500"
          )}
        />
        <span className="text-sm font-medium">
          {raffle.status === "active" ? "Sorteio ativo" : "Pausado"}
        </span>
        {raffle.keyword && (
          <code className="ml-1 rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-xs text-purple-400">
            {raffle.keyword}
          </code>
        )}
        <span className="ml-auto text-sm font-semibold tabular-nums text-purple-400">
          {count} participando
        </span>
      </div>

      <ChatFilterRow activeFilter={state.filter} onChange={actions.setFilter} />
      <ChatFeed messages={messages} filter={state.filter} className="flex-1" />
    </div>
  );
}
