import { NextRequest, NextResponse } from "next/server";
import type { ZodError } from "zod";
import { checkRateLimit } from "@lib/rate-limit";
import { recordBotAudit } from "@lib/bot-audit";
import type { SessionUser } from "@lib/admin-auth";
import { jsonError } from "@api/shared/api-response";
import type { BotCommandValidatedFields } from "@server/bot/bot.validators";
import type { BotCommandWriteAdvancedFields } from "@lib/bot-db-queries";
import { createRandomString } from "@utils/factories/create-random-string";

const MUTATION_LIMIT = 30;
const MUTATION_WINDOW_MS = 60_000;

export function resolveActorUsername(user: SessionUser): string {
  return user.twitchUsername ?? user.name ?? user.id;
}

export function enforceBotCommandMutationRateLimit(
  userId: string
): NextResponse | null {
  const result = checkRateLimit(
    `bot-cmd-mut:${userId}`,
    MUTATION_LIMIT,
    MUTATION_WINDOW_MS
  );

  if (!result.allowed) {
    return jsonError(
      "Muitas requisições. Tente novamente em instantes.",
      429,
      "RATE_LIMITED",
      { "Retry-After": String(result.retryAfterSeconds) }
    );
  }

  return null;
}

export function formatTriggerConflictMessage(trigger: string): string {
  const display = trigger.startsWith("!") ? trigger : `!${trigger}`;
  return `O trigger ${display} já está em uso por outro comando.`;
}

export function advancedFieldsFromValidated(
  data: Partial<BotCommandValidatedFields>
): BotCommandWriteAdvancedFields {
  const fields: BotCommandWriteAdvancedFields = {};

  if (data.userCooldown !== undefined) fields.userCooldown = data.userCooldown;
  if (data.minPermission !== undefined) fields.minPermission = data.minPermission;
  if (data.bypassCooldownFor !== undefined) {
    fields.bypassCooldownFor = data.bypassCooldownFor;
  }
  if (data.maxUsesPerStream !== undefined) {
    fields.maxUsesPerStream = data.maxUsesPerStream;
  }
  if (data.maxUsesPerUserPerStream !== undefined) {
    fields.maxUsesPerUserPerStream = data.maxUsesPerUserPerStream;
  }
  if (data.seasonalLimitType !== undefined) {
    fields.seasonalLimitType = data.seasonalLimitType;
  }
  if (data.seasonalLimitAmount !== undefined) {
    fields.seasonalLimitAmount = data.seasonalLimitAmount;
  }
  if (data.seasonalLimitDays !== undefined) {
    fields.seasonalLimitDays = data.seasonalLimitDays;
  }
  if (data.requiresConfirmation !== undefined) {
    fields.requiresConfirmation = data.requiresConfirmation;
  }
  if (data.isActionResponse !== undefined) {
    fields.isActionResponse = data.isActionResponse;
  }
  if (data.isCaseSensitive !== undefined) {
    fields.isCaseSensitive = data.isCaseSensitive;
  }
  if (data.aliases !== undefined) fields.aliases = data.aliases;
  if (data.argValidationType !== undefined) {
    fields.argValidationType = data.argValidationType;
  }
  if (data.argRegexPattern !== undefined) {
    fields.argRegexPattern = data.argRegexPattern;
  }
  if (data.argValidationError !== undefined) {
    fields.argValidationError = data.argValidationError;
  }
  if (data.responseType !== undefined) fields.responseType = data.responseType;
  if (data.responseAlternatives !== undefined) {
    fields.responseAlternatives = data.responseAlternatives;
  }

  return fields;
}

export function collectTriggersForConflictCheck(data: {
  trigger?: string;
  aliases?: string[];
}): string[] {
  const triggers: string[] = [];
  if (data.trigger) triggers.push(data.trigger);
  if (data.aliases?.length) triggers.push(...data.aliases);
  return triggers;
}

export async function logInvalidRegexAttempt(input: {
  streamerId: string;
  actor: SessionUser;
  error: ZodError;
  body: unknown;
  targetId?: string;
}) {
  const regexIssue = input.error.issues.find((issue) =>
    issue.path.includes("argRegexPattern")
  );
  if (!regexIssue) return;

  const bodyObj =
    input.body && typeof input.body === "object"
      ? (input.body as Record<string, unknown>)
      : {};

  await recordBotAudit({
    id: createRandomString(16),
    streamerId: input.streamerId,
    actorUserId: input.actor.id,
    actorUsername: resolveActorUsername(input.actor),
    targetType: "bot_command",
    targetId: input.targetId ?? "new",
    action: "invalid_regex_rejected",
    diff: {
      pattern: bodyObj.argRegexPattern ?? null,
      message: regexIssue.message,
    },
  });
}
