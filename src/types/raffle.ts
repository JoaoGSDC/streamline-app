export type RaffleMode =
  | "keyword"
  | "points"
  | "manual"
  | "sub_only"
  | "vip_only"
  | "follower_only";

export type RaffleStatus =
  | "draft"
  | "active"
  | "paused"
  | "closed"
  | "drawing"
  | "completed"
  | "cancelled";

export type RaffleEntrySource = "chat" | "manual" | "imported";

export type RaffleWinnerStatus = "pending" | "confirmed" | "rerolled" | "no_response";

export type RaffleMessageType =
  | "entry"
  | "chat"
  | "system"
  | "winner_response"
  | "confirmation";

export interface RaffleRow {
  id: string;
  channelId: string;
  streamerId: string;
  mode: RaffleMode;
  keyword: string | null;
  title: string | null;
  prizeDescription: string | null;
  winnerCount: number;
  maxEntriesPerUser: number;
  durationSeconds: number | null;
  pointsCost: number;
  requireFollower: boolean;
  minFollowDays: number;
  requireSub: boolean;
  allowedSubTiers: string[];
  requireVip: boolean;
  excludeMods: boolean;
  excludeVips: boolean;
  requireWinnerConfirmation: boolean;
  confirmationTimeoutSeconds: number;
  confirmationKeyword: string;
  announceStart: boolean;
  announceReminders: number[];
  announceWinner: boolean;
  status: RaffleStatus;
  startedAt: Date | null;
  closedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RaffleEntryRow {
  id: string;
  raffleId: string;
  twitchUserId: string;
  twitchLogin: string;
  displayName: string;
  entryCount: number;
  source: RaffleEntrySource;
  enteredAt: Date;
}

export interface RaffleWinnerRow {
  id: string;
  raffleId: string;
  entryId: string;
  position: number;
  drawnAt: Date;
  confirmedAt: Date | null;
  rerolledAt: Date | null;
  rerollReason: string | null;
  status: RaffleWinnerStatus;
  twitchUserId?: string;
  twitchLogin?: string;
  displayName?: string;
}

export interface RaffleChatMessageRow {
  id: number;
  raffleId: string;
  twitchUserId: string;
  twitchLogin: string;
  displayName: string;
  message: string;
  messageType: RaffleMessageType;
  sentAt: Date;
}

/** Snapshot completo para painel / SSE */
export interface RaffleConfig extends RaffleRow {
  entriesCount: number;
  uniqueUserCount: number;
  entries: RaffleEntryRow[];
  winners: RaffleWinnerRow[];
  recentMessages: RaffleChatMessageRow[];
  winnerMessages: Record<string, RaffleChatMessageRow[]>;
  eligibilityLabel?: string;
}

export interface BotRaffleUserMeta {
  isSub: boolean;
  subTier: "1" | "2" | "3" | null;
  isFollower: boolean;
  followDays: number;
  isMod: boolean;
  isVip: boolean;
}

export interface BotRaffleEntryRequest {
  channelId: string;
  twitchUserId: string;
  twitchLogin: string;
  displayName: string;
  message: string;
  userMeta: BotRaffleUserMeta;
}

export interface BotRaffleEntryResponse {
  accepted: boolean;
  message: string;
  reason?:
    | "already_entered"
    | "not_eligible"
    | "insufficient_points"
    | "raffle_not_active";
}

export interface BotActiveRaffleSnapshot {
  id: string;
  name: string;
  keyword: string | null;
  mode: RaffleMode;
  status: RaffleStatus;
  pointsCost: number;
  entries: string[];
}
