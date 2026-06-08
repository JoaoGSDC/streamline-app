import { z, type ZodIssue } from "zod";
import { DEFAULT_LEVELS_DEFINITION } from "./economy.types";

export function formatZodErrorMessages(error: z.ZodError): string {
  return error.issues.map((issue: ZodIssue) => issue.message).join("; ");
}

const levelDefinitionSchema = z.object({
  level: z.coerce.number().int().min(1).max(999),
  xpRequired: z.coerce.number().int().min(0),
  title: z.string().max(64).optional(),
});

export const updateEconomyGeneralSchema = z.object({
  enabled: z.boolean().optional(),
  pointsEnabled: z.boolean().optional(),
  levelsEnabled: z.boolean().optional(),
  publicRankingEnabled: z.boolean().optional(),
});

export const updateEconomyPointsSchema = z.object({
  pointsPerInterval: z.coerce.number().int().min(1).max(10000).optional(),
  intervalMinutes: z.coerce.number().int().min(1).max(120).optional(),
  minMessagesPerInterval: z.coerce.number().int().min(0).max(100).optional(),
  subscriberMultiplier: z.coerce.number().min(1).max(10).optional(),
  vipMultiplier: z.coerce.number().min(1).max(10).optional(),
  moderatorMultiplier: z.coerce.number().min(1).max(10).optional(),
  dailyPointsCap: z.coerce.number().int().min(1).max(1_000_000).nullable().optional(),
  earnMessageEnabled: z.boolean().optional(),
  earnMessageTemplate: z
    .string()
    .max(500)
    .nullable()
    .optional(),
});

export const updateEconomyLevelsSchema = z.object({
  xpFormula: z.enum(["linear", "exponential", "custom"]).optional(),
  xpPerMessage: z.coerce.number().int().min(0).max(1000).optional(),
  xpPerMinuteWatching: z.coerce.number().int().min(0).max(100).optional(),
  levelsDefinition: z
    .array(levelDefinitionSchema)
    .min(1)
    .max(100)
    .optional(),
});

export const economyUserAdjustSchema = z.object({
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  amount: z.coerce.number().int().min(1).max(10_000_000),
  reason: z.string().min(3, "Informe um motivo com pelo menos 3 caracteres").max(500),
});

export const economyUserResetSchema = z.object({
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  resetPoints: z.boolean().optional().default(false),
  resetXp: z.boolean().optional().default(false),
  reason: z.string().min(3, "Informe um motivo com pelo menos 3 caracteres").max(500),
});

export const economyResetAllPointsSchema = z.object({
  reason: z.string().min(3).max(500),
  confirmPhrase: z.literal("RESETAR TODOS OS PONTOS"),
});

export const economyAddViewerSchema = z.object({
  twitchUserId: z.string().min(1).optional(),
  twitchUsername: z
    .string()
    .min(1, "Informe o usuário Twitch")
    .max(64),
  displayName: z.string().min(1).max(64).optional(),
  initialPoints: z.coerce.number().int().min(0).max(10_000_000).optional().default(0),
});

export const economyRemoveViewerSchema = z.object({
  viewerId: z.string().min(1),
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  reason: z.string().min(3, "Informe um motivo com pelo menos 3 caracteres").max(500),
});

export const economySetPointsSchema = z.object({
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  points: z.coerce.number().int().min(0).max(10_000_000),
  reason: z.string().min(3, "Informe um motivo com pelo menos 3 caracteres").max(500),
});

export const botAdjustPointsSchema = z.object({
  action: z.enum(["add", "remove", "set"]),
  amount: z.coerce.number().int().min(0).max(10_000_000),
  targetTwitchUserId: z.string().min(1).optional(),
  targetTwitchUsername: z.string().min(1).max(64),
  targetDisplayName: z.string().min(1).max(64).optional(),
  actorTwitchUserId: z.string().min(1),
  actorTwitchUsername: z.string().min(1).max(64),
  actorDisplayName: z.string().min(1).max(64),
  commandKey: z.string().max(64).optional(),
  reason: z.string().min(3).max(500).optional(),
});

export const botAwardPointsSchema = z.object({
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  basePoints: z.coerce.number().int().min(0).max(10000),
  multiplier: z.coerce.number().min(0).max(20).optional().default(1),
  messagesInInterval: z.coerce.number().int().min(0).optional(),
  source: z.enum(["watch_time", "message", "manual_bot"]).optional().default("watch_time"),
});

export const botAwardXpSchema = z.object({
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  xpAmount: z.coerce.number().int().min(0).max(10000),
  source: z.enum(["message", "watch_time", "manual_bot"]).optional(),
});

export const botSyncViewerSchema = z.object({
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
});

export const botClaimLiveRewardSchema = z.object({
  rewardKey: z.enum(["daily", "early"]),
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  streamStartedAt: z
    .string()
    .min(1)
    .max(64)
    .regex(/^\d{4}-\d{2}-\d{2}T/, "streamStartedAt deve ser ISO 8601 (started_at da Twitch)"),
});

export const defaultLevelsDefinitionJson = JSON.stringify(DEFAULT_LEVELS_DEFINITION);
