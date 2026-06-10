import { GENERAL_BUILTIN_COMMANDS } from "./general";
import { QUOTES_BUILTIN_COMMANDS } from "./quotes";
import { MODERATOR_BUILTIN_COMMANDS } from "./moderator";
import { RAFFLES_BUILTIN_COMMANDS } from "./raffles";
import { STREAMER_BUILTIN_COMMANDS } from "./streamer";
import type { BotBuiltinCategory, BotBuiltinCommandDefinition } from "./types";
import {
  BOT_BUILTIN_CATEGORY_LABELS,
  BOT_BUILTIN_CATEGORY_ORDER,
  DEPRECATED_BUILTIN_KEYS,
} from "./types";

export type {
  BotBuiltinCategory,
  BotBuiltinCommandDefinition,
  BotBuiltinExecutionKind,
  BotBuiltinMinRole,
} from "./types";

export {
  BOT_BUILTIN_CATEGORY_LABELS,
  BOT_BUILTIN_CATEGORY_ORDER,
  DEPRECATED_BUILTIN_KEYS,
  LEGACY_RUNTIME_RESPONSE_PLACEHOLDER,
  DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT,
  DEFAULT_CONFIRMATION_ACCEPT_WORDS,
  DEFAULT_CONFIRMATION_REJECT_WORDS,
  DEFAULT_CONFIRMATION_TIMEOUT_SECONDS,
} from "./types";

export const BOT_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  ...GENERAL_BUILTIN_COMMANDS,
  ...QUOTES_BUILTIN_COMMANDS,
  ...RAFFLES_BUILTIN_COMMANDS,
  ...MODERATOR_BUILTIN_COMMANDS,
  ...STREAMER_BUILTIN_COMMANDS,
];

export function getBuiltinDefinition(
  key: string
): BotBuiltinCommandDefinition | undefined {
  return BOT_BUILTIN_COMMANDS.find((item) => item.key === key);
}

export function getBuiltinDefinitionByTrigger(
  trigger: string
): BotBuiltinCommandDefinition | undefined {
  const normalized = trigger.trim().toLowerCase();
  return BOT_BUILTIN_COMMANDS.find(
    (item) => item.trigger.toLowerCase() === normalized
  );
}

export function getBuiltinCommandsByCategory(): Record<
  BotBuiltinCategory,
  BotBuiltinCommandDefinition[]
> {
  const grouped = Object.fromEntries(
    BOT_BUILTIN_CATEGORY_ORDER.map((category) => [category, [] as BotBuiltinCommandDefinition[]])
  ) as Record<BotBuiltinCategory, BotBuiltinCommandDefinition[]>;

  for (const command of BOT_BUILTIN_COMMANDS) {
    grouped[command.category].push(command);
  }

  return grouped;
}
