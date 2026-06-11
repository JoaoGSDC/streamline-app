import type {
  BotCommandBypassCooldownRole,
  BotCommandMinPermission,
  BotCommandSeasonalLimitType,
} from "@server/bot/bot-command.types";
import type { BotCommandRowState } from "@features/bot/types/bot-command.types";

export const TRIGGER_MAX_LENGTH = 30;

const PERMISSION_LABELS: Record<BotCommandMinPermission, string> = {
  everyone: "Todos",
  follower: "Seguidores",
  subscriber: "Inscritos",
  vip: "VIPs",
  moderator: "Moderadores",
  streamer: "Streamer",
};

const BYPASS_LABELS: Record<BotCommandBypassCooldownRole, string> = {
  subscriber: "Inscritos",
  vip: "VIPs",
  moderator: "Moderadores",
  streamer: "Streamer",
};

export function capitalizeRole(role: string): string {
  return BYPASS_LABELS[role as BotCommandBypassCooldownRole] ?? role;
}

export function validateTrigger(trigger: string): string | null {
  if (!trigger.startsWith("!")) {
    return "Comandos devem começar com !";
  }
  if (/\s/.test(trigger)) {
    return "Comandos não podem conter espaços";
  }
  if (!/^![a-zA-Z0-9_]+$/.test(trigger)) {
    return "Use apenas letras, números e underscore após o !";
  }
  if (trigger.length > TRIGGER_MAX_LENGTH) {
    return `Máximo de ${TRIGGER_MAX_LENGTH} caracteres`;
  }
  if (trigger.length < 2) {
    return "Trigger muito curto";
  }
  return null;
}

export function validateAlias(alias: string): string | null {
  return validateTrigger(alias);
}

export function formatCooldownShort(seconds: number): string {
  if (seconds <= 0) return "sem cooldown";
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  }
  return seconds === 1 ? "1 segundo" : `${seconds} segundos`;
}

export function permissionSummary(command: BotCommandRowState): string {
  const base = PERMISSION_LABELS[command.minPermission] ?? "Todos";
  if (command.bypassCooldownFor.length === 0) return base;
  const bypass = command.bypassCooldownFor
    .map((role) => capitalizeRole(role))
    .join(", ");
  return `${base} · ${bypass} ignoram cooldown`;
}

export function limitsSummary(command: BotCommandRowState): string {
  const parts: string[] = [];

  if (command.cooldownSeconds > 0) {
    parts.push(`Cooldown ${formatCooldownShort(command.cooldownSeconds)}`);
  }
  if (command.userCooldown > 0) {
    parts.push(`Por viewer ${formatCooldownShort(command.userCooldown)}`);
  }
  if (command.maxUsesPerStream > 0) {
    parts.push(`Máx. ${command.maxUsesPerStream}x por stream`);
  }
  if (command.maxUsesPerUserPerStream > 0) {
    parts.push(`Máx. ${command.maxUsesPerUserPerStream}x por viewer/stream`);
  }
  if (command.seasonalLimitType !== "none" && command.seasonalLimitAmount > 0) {
    parts.push(
      `${command.seasonalLimitAmount}x ${seasonalPeriodLabel(command.seasonalLimitType)}`
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "Sem limites configurados";
}

export function seasonalPeriodLabel(type: BotCommandSeasonalLimitType): string {
  switch (type) {
    case "daily":
      return "por dia";
    case "weekly":
      return "por semana";
    case "monthly":
      return "por mês";
    case "custom_interval":
      return "no período";
    default:
      return "";
  }
}

export function seasonalExample(command: BotCommandRowState): string {
  const amount = command.seasonalLimitAmount;
  if (!amount || command.seasonalLimitType === "none") return "";

  if (command.seasonalLimitType === "custom_interval") {
    const days = command.seasonalLimitDays || 1;
    return `Cada viewer pode usar até ${amount} vez${amount > 1 ? "es" : ""} a cada ${days} dia${days > 1 ? "s" : ""}.`;
  }

  const period =
    command.seasonalLimitType === "daily"
      ? "por dia"
      : command.seasonalLimitType === "weekly"
        ? "por semana"
        : "por mês";

  return `Cada viewer pode usar até ${amount} vez${amount > 1 ? "es" : ""} ${period}.`;
}

export type CooldownUnit = "seconds" | "minutes" | "hours";

export function secondsToCooldownDisplay(
  seconds: number,
  unit: CooldownUnit
): number {
  if (unit === "hours") return seconds >= 3600 ? Math.round(seconds / 3600) : 0;
  if (unit === "minutes") return seconds >= 60 ? Math.round(seconds / 60) : 0;
  return seconds;
}

export function cooldownDisplayToSeconds(
  value: number,
  unit: CooldownUnit
): number {
  if (unit === "hours") return value * 3600;
  if (unit === "minutes") return value * 60;
  return value;
}

export function inferCooldownUnit(seconds: number): CooldownUnit {
  if (seconds > 0 && seconds % 3600 === 0) return "hours";
  if (seconds > 0 && seconds % 60 === 0) return "minutes";
  return "seconds";
}

export type { RegexTestResult } from "@/lib/regex-utils";
export { testRegexSafely } from "@/lib/regex-utils";

export function buildCustomCommandPayload(command: BotCommandRowState) {
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
    pointsEffect: command.pointsEffect ?? null,
    counterEffect: command.counterEffect ?? null,
    cooldownMessage: command.cooldownMessage ?? null,
  };
}
