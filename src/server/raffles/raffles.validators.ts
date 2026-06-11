import { z } from "zod";

const keywordRegex = /^[!a-zA-Z0-9_]+$/;

const raffleBaseSchema = z.object({
  mode: z.enum([
    "keyword",
    "points",
    "manual",
    "sub_only",
    "vip_only",
    "follower_only",
  ]),
  keyword: z
    .string()
    .min(1)
    .max(50)
    .regex(keywordRegex, "Keyword inválida")
    .optional(),
  title: z.string().max(120).optional(),
  prizeDescription: z.string().max(300).optional(),
  winnerCount: z.coerce.number().int().min(1).max(10).default(1),
  maxEntriesPerUser: z.coerce.number().int().min(1).max(10).default(1),
  durationSeconds: z.coerce.number().int().min(30).max(7200).nullable().default(null),
  pointsCost: z.coerce.number().int().min(0).max(1_000_000).default(0),
  requireFollower: z.boolean().default(false),
  minFollowDays: z.coerce.number().int().min(0).max(3650).default(0),
  requireSub: z.boolean().default(false),
  allowedSubTiers: z.array(z.enum(["1", "2", "3"])).default(["1", "2", "3"]),
  requireVip: z.boolean().default(false),
  excludeMods: z.boolean().default(false),
  excludeVips: z.boolean().default(false),
  requireWinnerConfirmation: z.boolean().default(false),
  confirmationTimeoutSeconds: z.coerce.number().int().min(15).max(300).default(60),
  confirmationKeyword: z.string().min(1).max(30).default("sim"),
  announceStart: z.boolean().default(true),
  announceReminders: z
    .array(z.coerce.number().int().min(10).max(3600))
    .max(5)
    .default([120, 60, 30]),
  announceWinner: z.boolean().default(true),
});

export const raffleCreateSchema = raffleBaseSchema.superRefine((data, ctx) => {
    if (data.mode === "keyword" && !data.keyword?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["keyword"],
        message: "Keyword obrigatória para modo keyword",
      });
    }
    if (data.mode === "points" && data.pointsCost === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["pointsCost"],
        message: "Custo em pontos deve ser > 0 para modo points",
      });
    }
  });

export const raffleUpdateSchema = raffleBaseSchema.partial();

export const raffleManualEntrySchema = z.object({
  twitchLogin: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100).optional(),
  entryCount: z.coerce.number().int().min(1).max(10).default(1),
});

export const raffleRerollSchema = z.object({
  winnerId: z.string().min(1),
  position: z.coerce.number().int().min(1).max(10).optional(),
  reason: z.string().max(200).optional(),
});

export const botRaffleEntrySchema = z.object({
  channelId: z.string().min(1),
  twitchUserId: z.string().min(1),
  twitchLogin: z.string().min(1),
  displayName: z.string().min(1),
  message: z.string().max(500),
  userMeta: z.object({
    isSub: z.boolean(),
    subTier: z.enum(["1", "2", "3"]).nullable(),
    isFollower: z.boolean(),
    followDays: z.coerce.number().int().min(0),
    isMod: z.boolean(),
    isVip: z.boolean(),
  }),
});

export const botRaffleMessageSchema = z.object({
  channelId: z.string().min(1),
  raffleId: z.string().uuid(),
  twitchUserId: z.string().min(1),
  twitchLogin: z.string().min(1),
  displayName: z.string().min(1),
  message: z.string().max(500),
  messageType: z
    .enum(["entry", "chat", "system", "winner_response", "confirmation"])
    .default("chat"),
});

export function formatRafflesZodError(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join("; ");
}
