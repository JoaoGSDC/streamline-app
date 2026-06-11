import {
  BOT_COMMAND_ADVANCED_DEFAULTS,
  BOT_COMMAND_ARG_VALIDATION_TYPES,
  BOT_COMMAND_BYPASS_COOLDOWN_ROLES,
  BOT_COMMAND_MIN_PERMISSIONS,
  BOT_COMMAND_RESPONSE_TYPES,
  BOT_COMMAND_SEASONAL_LIMIT_TYPES,
  type BotCommandAdvancedFields,
  type BotCommandArgValidationType,
  type BotCommandBypassCooldownRole,
  type BotCommandMinPermission,
  type BotCommandResponseType,
  type BotCommandSeasonalLimitType,
} from "@server/bot/bot-command.types";
import {
  parseCommandCounterEffect,
  serializeCommandCounterEffect,
  type CommandCounterEffect,
} from "@server/bot/command-counter-effect";
import {
  parseCommandPointsEffect,
  serializeCommandPointsEffect,
  type CommandPointsEffect,
} from "@server/bot/command-points-effect";
import type { botCommands } from "./schema";

function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseBypassRoles(raw: string | null | undefined): BotCommandBypassCooldownRole[] {
  const allowed = new Set<string>(BOT_COMMAND_BYPASS_COOLDOWN_ROLES);
  return parseJsonStringArray(raw).filter((role): role is BotCommandBypassCooldownRole =>
    allowed.has(role)
  );
}

function asEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export function serializeJsonStringArray(values: string[]): string {
  return JSON.stringify(values);
}

export function serializeCommandPointsEffectField(
  effect: CommandPointsEffect | null | undefined
): string | null {
  return serializeCommandPointsEffect(effect);
}

export function mapBotCommandPointsEffect(
  row: typeof botCommands.$inferSelect
): CommandPointsEffect | null {
  return parseCommandPointsEffect(row.pointsEffect);
}

export function mapBotCommandCounterEffect(
  row: typeof botCommands.$inferSelect
): CommandCounterEffect | null {
  return parseCommandCounterEffect(row.counterEffect);
}

export function serializeCommandCounterEffectField(
  effect: CommandCounterEffect | null | undefined
): string | null {
  return serializeCommandCounterEffect(effect);
}

export function mapBotCommandAdvancedFields(
  row: typeof botCommands.$inferSelect
): BotCommandAdvancedFields {
  return {
    userCooldown: row.userCooldown ?? BOT_COMMAND_ADVANCED_DEFAULTS.userCooldown,
    minPermission: asEnum(
      row.minPermission,
      BOT_COMMAND_MIN_PERMISSIONS,
      BOT_COMMAND_ADVANCED_DEFAULTS.minPermission
    ),
    bypassCooldownFor: parseBypassRoles(row.bypassCooldownFor),
    maxUsesPerStream:
      row.maxUsesPerStream ?? BOT_COMMAND_ADVANCED_DEFAULTS.maxUsesPerStream,
    maxUsesPerUserPerStream:
      row.maxUsesPerUserPerStream ??
      BOT_COMMAND_ADVANCED_DEFAULTS.maxUsesPerUserPerStream,
    seasonalLimitType: asEnum(
      row.seasonalLimitType,
      BOT_COMMAND_SEASONAL_LIMIT_TYPES,
      BOT_COMMAND_ADVANCED_DEFAULTS.seasonalLimitType
    ),
    seasonalLimitAmount:
      row.seasonalLimitAmount ?? BOT_COMMAND_ADVANCED_DEFAULTS.seasonalLimitAmount,
    seasonalLimitDays:
      row.seasonalLimitDays ?? BOT_COMMAND_ADVANCED_DEFAULTS.seasonalLimitDays,
    requiresConfirmation: Boolean(
      row.requiresConfirmation ?? BOT_COMMAND_ADVANCED_DEFAULTS.requiresConfirmation
    ),
    isActionResponse: Boolean(
      row.isActionResponse ?? BOT_COMMAND_ADVANCED_DEFAULTS.isActionResponse
    ),
    isCaseSensitive: Boolean(
      row.isCaseSensitive ?? BOT_COMMAND_ADVANCED_DEFAULTS.isCaseSensitive
    ),
    aliases: parseJsonStringArray(row.aliases),
    argValidationType: asEnum(
      row.argValidationType,
      BOT_COMMAND_ARG_VALIDATION_TYPES,
      BOT_COMMAND_ADVANCED_DEFAULTS.argValidationType
    ),
    argRegexPattern: row.argRegexPattern ?? null,
    argValidationError: row.argValidationError ?? null,
    responseType: asEnum(
      row.responseType,
      BOT_COMMAND_RESPONSE_TYPES,
      BOT_COMMAND_ADVANCED_DEFAULTS.responseType
    ),
    responseAlternatives: parseJsonStringArray(row.responseAlternatives),
    useCount: row.useCount ?? BOT_COMMAND_ADVANCED_DEFAULTS.useCount,
    cooldownMessage: row.cooldownMessage ?? null,
  };
}
