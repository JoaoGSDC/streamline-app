"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RaffleConfigPanel } from "./components/RaffleConfigPanel";
import { RaffleFeed } from "./components/RaffleFeed";
import { RaffleParticipants } from "./components/RaffleParticipants";
import { RaffleHistory } from "./components/RaffleHistory";
import { RaffleStatusBadge } from "./components/RaffleStatusBadge";
import { useRaffleState } from "./hooks/useRaffleState";

export default function SorteiosPage() {
  const { raffle, state, actions } = useRaffleState();

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Sorteios</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Realize sorteios ao vivo com o chat da Twitch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {raffle && <RaffleStatusBadge status={raffle.status} />}
          <Button variant="outline" size="sm" onClick={actions.openHistory}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            Histórico
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-x divide-border/40 overflow-hidden lg:grid-cols-[220px_1fr_200px]">
        <RaffleConfigPanel raffle={raffle} state={state} actions={actions} />
        <RaffleFeed raffle={raffle} state={state} actions={actions} />
        <RaffleParticipants raffle={raffle} state={state} actions={actions} />
      </div>

      <RaffleHistory open={state.historyOpen} onClose={actions.closeHistory} />
    </div>
  );
}
