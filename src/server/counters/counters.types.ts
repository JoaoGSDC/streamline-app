export const COUNTER_TYPES = [
  "incremental",
  "decremental",
  "free",
  "goal",
  "percent",
] as const;

export type CounterType = (typeof COUNTER_TYPES)[number];

export const COUNTER_STATUSES = ["active", "archived"] as const;

export type CounterStatus = (typeof COUNTER_STATUSES)[number];

export const COUNTER_RESET_POLICIES = [
  "manual",
  "auto_stream_start",
  "auto_daily",
  "auto_weekly",
] as const;

export type CounterResetPolicy = (typeof COUNTER_RESET_POLICIES)[number];

export const COUNTER_OPERATIONS = [
  "increment",
  "decrement",
  "set",
  "reset",
] as const;

export type CounterOperation = (typeof COUNTER_OPERATIONS)[number];

export const COUNTER_CHANGE_SOURCES = [
  "panel",
  "chat",
  "moderator",
  "api",
  "automation",
  "bot",
] as const;

export type CounterChangeSource = (typeof COUNTER_CHANGE_SOURCES)[number];

export const COUNTER_SOURCES = [
  "manual",
  "twitch_followers",
  "twitch_subscribers",
] as const;

export type CounterSource = (typeof COUNTER_SOURCES)[number];

export interface CounterCategoryDto {
  id: string;
  streamerId: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  counterCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounterOverlayConfig {
  layout?: "horizontal" | "vertical" | "compact";
  showLabel?: boolean;
  showEmoji?: boolean;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  textColor?: string;
  accentColor?: string;
  showGoal?: boolean;
  animation?: "none" | "pulse" | "shake";
}

export interface CounterDto {
  id: string;
  streamerId: string;
  categoryId: string | null;
  categoryName: string | null;
  slug: string;
  name: string;
  description: string | null;
  type: CounterType;
  value: number;
  minValue: number | null;
  maxValue: number | null;
  goalValue: number | null;
  goalReachedAt: Date | null;
  color: string;
  icon: string | null;
  emoji: string | null;
  tags: string[];
  visibility: string;
  status: CounterStatus;
  resetPolicy: CounterResetPolicy;
  source: CounterSource;
  readonly: boolean;
  overlayConfig: CounterOverlayConfig;
  sortOrder: number;
  useCount: number;
  lastChangedAt: Date | null;
  lastChangedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounterHistoryEntryDto {
  id: string;
  streamerId: string;
  counterId: string;
  counterSlug: string;
  counterName: string;
  previousValue: number;
  newValue: number;
  delta: number | null;
  operation: CounterOperation;
  source: CounterChangeSource;
  actorUserId: string | null;
  actorUsername: string | null;
  actorDisplayName: string | null;
  createdAt: Date;
}

export interface CountersChannelConfigDto {
  streamerId: string;
  enabled: boolean;
  configVersion: number;
  liveModePins: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CountersDashboardDto {
  totalCounters: number;
  activeCounters: number;
  goalsInProgress: number;
  totalAdjustmentsToday: number;
  mostUsed: Array<{ id: string; name: string; slug: string; useCount: number }>;
  recentlyChanged: Array<{
    counterId: string;
    name: string;
    slug: string;
    value: number;
    changedAt: Date;
    changedBy: string | null;
  }>;
  recentHistory: CounterHistoryEntryDto[];
}

export interface CountersListResult {
  items: CounterDto[];
  total: number;
}

export interface CounterListFilters {
  q?: string;
  categoryId?: string;
  status?: CounterStatus;
  tag?: string;
}

export interface CreateCounterInput {
  id: string;
  streamerId: string;
  name: string;
  slug?: string;
  description?: string | null;
  type?: CounterType;
  value?: number;
  minValue?: number | null;
  maxValue?: number | null;
  goalValue?: number | null;
  color?: string;
  icon?: string | null;
  emoji?: string | null;
  categoryId?: string | null;
  tags?: string[];
  resetPolicy?: CounterResetPolicy;
  source?: CounterSource;
  readonly?: boolean;
  overlayConfig?: CounterOverlayConfig;
}

export interface BotAdjustCounterInput {
  slug: string;
  operation: CounterOperation;
  amount?: number;
  twitchUserId?: string;
  twitchUsername?: string;
  displayName?: string;
  source?: CounterChangeSource;
}

/** Snapshot leve para o bot ({count:slug}) */
export interface CounterBotSnapshot {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  value: number;
  goalValue: number | null;
  type: CounterType;
  source: CounterSource;
  readonly: boolean;
}
