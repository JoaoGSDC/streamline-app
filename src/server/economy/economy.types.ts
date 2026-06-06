export interface EconomyLevelDefinition {
  level: number;
  xpRequired: number;
  title?: string;
}

export const DEFAULT_LEVELS_DEFINITION: EconomyLevelDefinition[] = [
  { level: 1, xpRequired: 0, title: "Iniciante" },
  { level: 2, xpRequired: 100, title: "Regular" },
  { level: 3, xpRequired: 250, title: "Fã" },
  { level: 4, xpRequired: 500, title: "Veterano" },
  { level: 5, xpRequired: 1000, title: "Lenda" },
];

export type EconomyAuditAction =
  | "add_points"
  | "remove_points"
  | "set_points"
  | "add_coins"
  | "remove_coins"
  | "reset_points"
  | "reset_xp"
  | "reset_all_channel_points";

export type EconomyCurrencyType = "points" | "coins" | "xp";

export interface EconomyGeneralConfigDto {
  enabled: boolean;
  pointsEnabled: boolean;
  levelsEnabled: boolean;
  publicRankingEnabled: boolean;
  configVersion: number;
  updatedAt: Date;
}

export interface EconomyPointsConfigDto {
  pointsPerInterval: number;
  intervalMinutes: number;
  minMessagesPerInterval: number;
  subscriberMultiplier: number;
  vipMultiplier: number;
  moderatorMultiplier: number;
  dailyPointsCap: number | null;
  earnMessageEnabled: boolean;
  earnMessageTemplate: string | null;
  updatedAt: Date;
}

export interface EconomyLevelsConfigDto {
  xpFormula: "linear" | "exponential" | "custom";
  xpPerMessage: number;
  xpPerMinuteWatching: number;
  levelsDefinition: EconomyLevelDefinition[];
  updatedAt: Date;
}

export interface EconomyFullConfigDto {
  general: EconomyGeneralConfigDto;
  points: EconomyPointsConfigDto;
  levels: EconomyLevelsConfigDto;
}

export interface ChannelViewerEconomyDto {
  id: string;
  streamerId: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  points: number;
  xp: number;
  level: number;
  levelTitle?: string;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformUserCoinsDto {
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  coins: number;
  updatedAt: Date;
}

export interface ViewerBalanceDto {
  channel: ChannelViewerEconomyDto | null;
  coins: PlatformUserCoinsDto | null;
}

export interface EconomyOverviewDto {
  enabled: boolean;
  pointsEnabled: boolean;
  levelsEnabled: boolean;
  totalUsers: number;
  totalPointsDistributed: number;
  activeLevelsCount: number;
  configVersion: number;
}

export interface EconomyAuditLogDto {
  id: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  targetTwitchUserId: string;
  targetTwitchUsername: string;
  action: EconomyAuditAction;
  currencyType: EconomyCurrencyType;
  previousValue: number;
  newValue: number;
  delta: number;
  reason: string;
  createdAt: Date;
}

export interface EconomyRankingEntryDto {
  position: number;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  points: number;
  xp: number;
  level: number;
  levelTitle?: string;
  lastActivityAt: Date | null;
  createdAt: Date;
}
