import type {
  RaffleChatMessageRow,
  RaffleConfig,
  RaffleEntryRow,
  RaffleStatus,
  RaffleWinnerRow,
} from "@/types/raffle";

type RaffleEvent =
  | { type: "snapshot"; data: RaffleConfig }
  | { type: "entries_added"; data: RaffleEntryRow[] }
  | { type: "messages"; data: RaffleChatMessageRow[] }
  | { type: "status_changed"; data: { status: RaffleStatus } }
  | { type: "entry_count"; data: number }
  | { type: "winner_drawn"; data: RaffleWinnerRow }
  | { type: "winner_confirmed"; data: RaffleWinnerRow };

type Subscriber = (event: RaffleEvent) => void;

const subscribers = new Map<string, Set<Subscriber>>();

export function subscribeRaffleEvents(raffleId: string, handler: Subscriber) {
  let set = subscribers.get(raffleId);
  if (!set) {
    set = new Set();
    subscribers.set(raffleId, set);
  }
  set.add(handler);
  return () => {
    set?.delete(handler);
    if (set?.size === 0) subscribers.delete(raffleId);
  };
}

export function publishRaffleEvent(raffleId: string, event: RaffleEvent) {
  const set = subscribers.get(raffleId);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(event);
    } catch {
      /* ignore subscriber errors */
    }
  }
}
