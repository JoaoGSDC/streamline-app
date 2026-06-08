import { MAX_CHAT_MESSAGE_LENGTH } from "@server/bot/bot-command.constants";

export const SAFE_TRIGGER = /^![a-zA-Z0-9_]{1,29}$/;

const FORBIDDEN_PREFIXES = [
  "/ban",
  "/timeout",
  "/mod ",
  "/unmod",
  "/clear",
  "/host",
  "/raid",
  "/slow",
  "/subscribers",
  "/emoteonly",
] as const;

const MAX_PICK_TOKENS = 20;
const MAX_RANDOM_TOKENS = 10;

export function countTemplateTokens(template: string): {
  pick: number;
  random: number;
} {
  return {
    pick: (template.match(/\{pick:/gi) ?? []).length,
    random: (template.match(/\{random(?::|\})/gi) ?? []).length,
  };
}

export function validateTemplateTokenLimits(template: string): string | null {
  const counts = countTemplateTokens(template);
  if (counts.pick > MAX_PICK_TOKENS) {
    return `Máximo de ${MAX_PICK_TOKENS} tokens {pick:} por template`;
  }
  if (counts.random > MAX_RANDOM_TOKENS) {
    return `Máximo de ${MAX_RANDOM_TOKENS} tokens {random:} por template`;
  }
  return null;
}

export function stripExcessTemplateTokens(template: string): string {
  let pickCount = 0;
  let randomCount = 0;

  const withoutPick = template.replace(/\{pick:[^}]+\}/gi, (match) => {
    pickCount += 1;
    return pickCount <= MAX_PICK_TOKENS ? match : "";
  });

  return withoutPick.replace(/\{random(?::[^}]*)?\}/gi, (match) => {
    randomCount += 1;
    return randomCount <= MAX_RANDOM_TOKENS ? match : "";
  });
}

/** Impede impersonação de comandos de mod no chat da Twitch. */
export function sanitizeResponse(response: string, isAction: boolean): string {
  const trimmed = response.trimStart();

  if (!isAction && trimmed.startsWith("/")) {
    const lower = trimmed.toLowerCase();
    const blocked = FORBIDDEN_PREFIXES.some((prefix) => lower.startsWith(prefix));
    if (blocked || !lower.startsWith("/me")) {
      return trimmed.slice(1);
    }
  }

  return response;
}

export function prepareBotResponse(
  response: string,
  isAction: boolean
): string {
  const sanitized = stripExcessTemplateTokens(sanitizeResponse(response, isAction));
  const trimmed = sanitized.trim();

  if (trimmed.length <= MAX_CHAT_MESSAGE_LENGTH) {
    return trimmed;
  }

  const suffix = "…";
  return `${trimmed.slice(0, MAX_CHAT_MESSAGE_LENGTH - suffix.length)}${suffix}`;
}
