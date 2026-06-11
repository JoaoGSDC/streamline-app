/** Tipos e defaults dos campos avançados de `bot_commands`. */

import type { CommandCounterEffect } from "./command-counter-effect";
import type { CommandPointsEffect } from "./command-points-effect";

export const BOT_COMMAND_MIN_PERMISSIONS = [
  "everyone",
  "follower",
  "subscriber",
  "vip",
  "moderator",
  "streamer",
] as const;

export type BotCommandMinPermission = (typeof BOT_COMMAND_MIN_PERMISSIONS)[number];

export const BOT_COMMAND_BYPASS_COOLDOWN_ROLES = [
  "subscriber",
  "vip",
  "moderator",
  "streamer",
] as const;

export type BotCommandBypassCooldownRole =
  (typeof BOT_COMMAND_BYPASS_COOLDOWN_ROLES)[number];

export const BOT_COMMAND_SEASONAL_LIMIT_TYPES = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "custom_interval",
] as const;

export type BotCommandSeasonalLimitType =
  (typeof BOT_COMMAND_SEASONAL_LIMIT_TYPES)[number];

export const BOT_COMMAND_ARG_VALIDATION_TYPES = [
  "none",
  "required",
  "regex",
] as const;

export type BotCommandArgValidationType =
  (typeof BOT_COMMAND_ARG_VALIDATION_TYPES)[number];

export const BOT_COMMAND_RESPONSE_TYPES = ["text", "random"] as const;

export type BotCommandResponseType = (typeof BOT_COMMAND_RESPONSE_TYPES)[number];

/** Valores padrão — preservam comportamento dos comandos existentes. */
export const BOT_COMMAND_ADVANCED_DEFAULTS = {
  userCooldown: 0,
  minPermission: "everyone" as BotCommandMinPermission,
  bypassCooldownFor: [] as BotCommandBypassCooldownRole[],
  maxUsesPerStream: 0,
  maxUsesPerUserPerStream: 0,
  seasonalLimitType: "none" as BotCommandSeasonalLimitType,
  seasonalLimitAmount: 0,
  seasonalLimitDays: 0,
  requiresConfirmation: false,
  isActionResponse: false,
  isCaseSensitive: false,
  aliases: [] as string[],
  argValidationType: "none" as BotCommandArgValidationType,
  argRegexPattern: null as string | null,
  argValidationError: null as string | null,
  responseType: "text" as BotCommandResponseType,
  responseAlternatives: [] as string[],
  useCount: 0,
  cooldownMessage: null as string | null,
} as const;

export interface BotCommandAdvancedFields {
  userCooldown: number;
  minPermission: BotCommandMinPermission;
  bypassCooldownFor: BotCommandBypassCooldownRole[];
  maxUsesPerStream: number;
  maxUsesPerUserPerStream: number;
  seasonalLimitType: BotCommandSeasonalLimitType;
  seasonalLimitAmount: number;
  seasonalLimitDays: number;
  requiresConfirmation: boolean;
  isActionResponse: boolean;
  isCaseSensitive: boolean;
  aliases: string[];
  argValidationType: BotCommandArgValidationType;
  argRegexPattern: string | null;
  argValidationError: string | null;
  responseType: BotCommandResponseType;
  responseAlternatives: string[];
  useCount: number;
  /** Mensagem exibida 1× por período de cooldown quando bloqueado */
  cooldownMessage: string | null;
}

export interface BotCommandDto extends BotCommandAdvancedFields {
  id: string;
  streamerId: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
  builtinKey: string | null;
  isBuiltin: boolean;
  pointsEffect: CommandPointsEffect | null;
  counterEffect: CommandCounterEffect | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotCommandUsageDto {
  id: string;
  commandId: string;
  channelId: string;
  twitchUserId: string;
  twitchLogin: string | null;
  streamId: string | null;
  usedAt: Date;
}

export type BotCommandUsagePeriod = "stream" | "day" | "week" | "month";

export interface BotCommandUsageStatsDto {
  commandId: string;
  period: BotCommandUsagePeriod;
  totalUses: number;
  uniqueUsers: number;
  topUsers: Array<{ login: string; count: number }>;
}
