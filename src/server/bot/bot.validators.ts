import { z, type ZodIssue } from "zod";
import {
  BOT_COMMAND_ARG_VALIDATION_TYPES,
  BOT_COMMAND_BYPASS_COOLDOWN_ROLES,
  BOT_COMMAND_MIN_PERMISSIONS,
  BOT_COMMAND_RESPONSE_TYPES,
  BOT_COMMAND_SEASONAL_LIMIT_TYPES,
  type BotCommandDto,
} from "@server/bot/bot-command.types";
import { commandPointsEffectSchema } from "@server/bot/command-points-effect";
import { isSafeRegex } from "@server/utils/is-safe-regex";
import {
  SAFE_TRIGGER,
  sanitizeResponse,
  validateTemplateTokenLimits,
} from "@server/bot/sanitize-response";

export function formatZodErrorMessages(error: z.ZodError): string {
  return error.issues.map((issue: ZodIssue) => issue.message).join("; ");
}

const commandTriggerRegex = SAFE_TRIGGER;

function refineBotCommandFields(data: {
  trigger: string;
  response?: string;
  responseAlternatives?: string[];
  argValidationType?: string;
  argRegexPattern?: string | null;
  seasonalLimitType?: string;
  seasonalLimitAmount?: number;
  seasonalLimitDays?: number;
  aliases?: string[];
}, ctx: z.RefinementCtx) {
  if (data.argValidationType === "regex" && !data.argRegexPattern) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["argRegexPattern"],
      message: "Pattern obrigatório quando validação é do tipo regex",
    });
  }

  if (data.argRegexPattern && !isSafeRegex(data.argRegexPattern)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["argRegexPattern"],
      message:
        "Regex com risco de catastrofic backtracking não é permitido",
    });
  }

  if (
    data.seasonalLimitType &&
    data.seasonalLimitType !== "none" &&
    (data.seasonalLimitAmount ?? 0) === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seasonalLimitAmount"],
      message: "Informe a quantidade máxima para o limite sazonal",
    });
  }

  if (
    data.seasonalLimitType === "custom_interval" &&
    (data.seasonalLimitAmount ?? 0) > 0 &&
    (data.seasonalLimitDays ?? 0) < 1
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seasonalLimitDays"],
      message: "Informe o intervalo em dias para o limite customizado",
    });
  }

  if (data.aliases?.includes(data.trigger)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["aliases"],
      message: "Alias não pode ser igual ao trigger principal",
    });
  }

  if (data.aliases && data.aliases.length > 1) {
    const normalized = data.aliases.map((alias) => alias.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aliases"],
        message: "Aliases duplicados não são permitidos",
      });
    }
  }

  const templates = [
    ...(data.response ? [data.response] : []),
    ...(data.responseAlternatives ?? []),
  ].filter((value) => value.trim().length > 0);

  for (const template of templates) {
    const tokenError = validateTemplateTokenLimits(template);
    if (tokenError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["response"],
        message: tokenError,
      });
      break;
    }
  }
}

const botCommandFieldsObject = z.object({
  trigger: z
    .string()
    .min(2, "Trigger deve ter pelo menos 2 caracteres")
    .max(30, "Trigger muito longo")
    .regex(commandTriggerRegex, {
      message:
        "Trigger deve começar com ! e conter apenas letras, números e _",
    }),
  response: z.string().max(500, "Resposta deve ter no máximo 500 caracteres"),
  cooldownSeconds: z.coerce
    .number()
    .int()
    .min(0)
    .max(86400)
    .default(0),
  enabled: z.boolean().optional().default(true),
  userCooldown: z.coerce.number().int().min(0).max(86400).default(0),
  minPermission: z.enum(BOT_COMMAND_MIN_PERMISSIONS).default("everyone"),
  bypassCooldownFor: z
    .array(z.enum(BOT_COMMAND_BYPASS_COOLDOWN_ROLES))
    .max(4)
    .default([]),
  maxUsesPerStream: z.coerce.number().int().min(0).max(10000).default(0),
  maxUsesPerUserPerStream: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(0),
  seasonalLimitType: z.enum(BOT_COMMAND_SEASONAL_LIMIT_TYPES).default("none"),
  seasonalLimitAmount: z.coerce.number().int().min(0).max(500).default(0),
  seasonalLimitDays: z.coerce.number().int().min(0).max(365).default(0),
  requiresConfirmation: z.boolean().default(false),
  isActionResponse: z.boolean().default(false),
  isCaseSensitive: z.boolean().default(false),
  aliases: z
    .array(
      z
        .string()
        .regex(commandTriggerRegex, {
          message:
            "Alias deve começar com ! e conter apenas letras, números e _",
        })
        .max(30)
    )
    .max(5)
    .default([]),
  argValidationType: z.enum(BOT_COMMAND_ARG_VALIDATION_TYPES).default("none"),
  argRegexPattern: z.string().max(300).nullable().optional(),
  argValidationError: z.string().max(200).nullable().optional(),
  responseType: z.enum(BOT_COMMAND_RESPONSE_TYPES).default("text"),
  responseAlternatives: z
    .array(z.string().max(500))
    .max(20)
    .default([]),
  pointsEffect: commandPointsEffectSchema.nullable().optional(),
  cooldownMessage: z.string().max(500).nullable().optional(),
});

export const botCommandFieldsSchema = botCommandFieldsObject.superRefine(
  refineBotCommandFields
);

export const createBotCommandSchema = botCommandFieldsObject
  .superRefine(refineBotCommandFields)
  .refine((data) => data.response.trim().length > 0, {
    message: "Resposta é obrigatória",
    path: ["response"],
  })
  .transform((data) => ({
    ...data,
    response: sanitizeResponse(data.response, data.isActionResponse),
    responseAlternatives: data.responseAlternatives.map((alt) =>
      sanitizeResponse(alt, data.isActionResponse)
    ),
  }));

export const updateBotCommandSchema = botCommandFieldsObject
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export type BotCommandValidatedFields = z.infer<typeof botCommandFieldsObject>;

export function commandDtoToValidationShape(
  command: BotCommandDto
): BotCommandValidatedFields {
  return {
    trigger: command.trigger,
    response: command.response,
    cooldownSeconds: command.cooldownSeconds,
    enabled: command.enabled,
    userCooldown: command.userCooldown,
    minPermission: command.minPermission,
    bypassCooldownFor: command.bypassCooldownFor,
    maxUsesPerStream: command.maxUsesPerStream,
    maxUsesPerUserPerStream: command.maxUsesPerUserPerStream,
    seasonalLimitType: command.seasonalLimitType,
    seasonalLimitAmount: command.seasonalLimitAmount,
    seasonalLimitDays: command.seasonalLimitDays,
    requiresConfirmation: command.requiresConfirmation,
    isActionResponse: command.isActionResponse,
    isCaseSensitive: command.isCaseSensitive,
    aliases: command.aliases,
    argValidationType: command.argValidationType,
    argRegexPattern: command.argRegexPattern,
    argValidationError: command.argValidationError,
    responseType: command.responseType,
    responseAlternatives: command.responseAlternatives,
    pointsEffect: command.pointsEffect,
    cooldownMessage: command.cooldownMessage,
  };
}

export function validateMergedBotCommandUpdate(
  existing: BotCommandDto,
  patch: z.infer<typeof updateBotCommandSchema>
) {
  const merged = {
    ...commandDtoToValidationShape(existing),
    ...patch,
  };
  return botCommandFieldsObject.superRefine(refineBotCommandFields).safeParse(merged);
}

export const botCommandUsagePeriodSchema = z.enum([
  "stream",
  "day",
  "week",
  "month",
]);

export const createBotTimerSchema = z.object({
  name: z.string().max(64).optional().nullable(),
  intervalMinutes: z.coerce.number().int().min(1).max(120),
  firstRunAfterMinutes: z.coerce.number().int().min(1).max(120).optional(),
  scheduleMode: z.enum(["live_elapsed"]).optional().default("live_elapsed"),
  message: z.string().min(1).max(500),
  minViewers: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  enabled: z.boolean().optional().default(true),
});

export const updateBotTimerSchema = createBotTimerSchema.partial();

const botBlacklistBaseSchema = z.object({
  term: z.string().min(1).max(100),
  matchType: z.enum(["exact", "contains"]).default("contains"),
  action: z.enum(["delete", "timeout"]).default("delete"),
  timeoutSeconds: z.coerce.number().int().min(1).max(1209600).optional(),
  enabled: z.boolean().optional().default(true),
});

function refineBlacklistTimeout<
  T extends z.ZodTypeAny,
>(schema: T) {
  return schema.superRefine(
    (
      data: {
        action?: "delete" | "timeout";
        timeoutSeconds?: number;
      },
      ctx: z.RefinementCtx
    ) => {
      if (data.action === "timeout" && !data.timeoutSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a duração do timeout em segundos",
          path: ["timeoutSeconds"],
        });
      }
    }
  );
}

export const createBotBlacklistSchema =
  refineBlacklistTimeout(botBlacklistBaseSchema);

export const updateBotBlacklistSchema = refineBlacklistTimeout(
  botBlacklistBaseSchema.partial()
);

const updateBotBuiltinCommandBaseSchema = z.object({
  response: z
    .string()
    .min(1, "Resposta é obrigatória")
    .max(500, "Resposta deve ter no máximo 500 caracteres"),
  enabled: z.boolean().optional(),
});

export const updateBotBuiltinCommandSchema = updateBotBuiltinCommandBaseSchema
  .partial()
  .refine(
    (data) =>
      data.response !== undefined || data.enabled !== undefined,
    { message: "Informe ao menos um campo para atualizar" }
  )
  .transform((data) => ({
    ...data,
    ...(data.response !== undefined
      ? { response: sanitizeResponse(data.response, false) }
      : {}),
  }));
