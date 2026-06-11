import type { BotCommandAdvancedFields } from "@server/bot/bot-command.types";
import type { CommandPointsEffect } from "@server/bot/command-points-effect";
import type { BotBuiltinCategoryId } from "@services/entities/bot-variables.services";

export interface BotCommandRowState extends BotCommandAdvancedFields {
  id: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
  isBuiltin: boolean;
  builtinKey?: string | null;
  description?: string;
  category?: string;
  categoryLabel?: string;
  minRole?: "everyone" | "moderator" | "streamer";
  argsHint?: string | null;
  customizableResponse?: boolean;
  responseTemplate?: string | null;
  confirmationPrompt?: string | null;
  runtimeNotes?: string | null;
  externalApiUrlTemplate?: string | null;
  economyRewardKey?: "daily" | "early" | null;
  economyRewardPoints?: number | null;
  pointsEffect?: CommandPointsEffect | null;
  counterEffect?: import("@server/bot/command-counter-effect").CommandCounterEffect | null;
  cooldownMessage: string | null;
  isDraft?: boolean;
  isNew?: boolean;
}

export type BotCommandCategoryFilter =
  | "all"
  | BotBuiltinCategoryId
  | "custom";

export const BUILTIN_CATEGORY_ORDER: BotBuiltinCategoryId[] = [
  "general",
  "raffles",
  "moderator",
  "streamer",
];

export const CATEGORY_FILTER_LABELS: Record<
  BotCommandCategoryFilter,
  string
> = {
  all: "Todos",
  general: "Gerais",
  raffles: "Sorteios",
  moderator: "Moderadores",
  streamer: "Streamer",
  custom: "Personalizados",
};

export const CATEGORY_SHORT_LABELS: Record<BotBuiltinCategoryId | "custom", string> =
  {
    general: "Geral",
    raffles: "Sorteios",
    moderator: "Moderadores",
    streamer: "Streamer",
    custom: "Personalizado",
  };

export function canEditCommandResponse(_command: BotCommandRowState): boolean {
  return true;
}

export function canOpenCommandEditor(command: BotCommandRowState): boolean {
  return Boolean(command.isDraft || command.isNew || command.id);
}

export function getCommandCategoryShort(command: BotCommandRowState): string {
  if (!command.isBuiltin) return CATEGORY_SHORT_LABELS.custom;
  const category = (command.category as BotBuiltinCategoryId) ?? "general";
  return CATEGORY_SHORT_LABELS[category] ?? CATEGORY_SHORT_LABELS.general;
}

export function getResponsePreview(command: BotCommandRowState): string {
  return (
    command.response.trim() ||
    command.responseTemplate?.trim() ||
    ""
  );
}

export function isAutomaticCommand(_command: BotCommandRowState): boolean {
  return false;
}
