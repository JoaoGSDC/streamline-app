import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEK_OPTS = { weekStartsOn: 1 as const, locale: ptBR };

export function coerceToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map((v) => parseInt(v, 10));
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value as string | number);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function getGameScheduledDate(game: {
  raw?: { scheduledDate?: unknown };
  scheduledAt?: number;
}): Date | null {
  const fromRaw = coerceToDate(game?.raw?.scheduledDate);
  if (fromRaw) return fromRaw;
  if (game.scheduledAt != null) return coerceToDate(game.scheduledAt);
  return null;
}

export function getGamesForDay<T extends { raw?: { scheduledDate?: unknown }; scheduledAt?: number }>(
  games: T[],
  day: Date
): T[] {
  return games.filter((game) => {
    const date = getGameScheduledDate(game);
    return date != null && isSameDay(date, day);
  });
}

export function getCurrentWeekDays(reference = new Date()) {
  const weekStart = startOfWeek(reference, WEEK_OPTS);
  const labels = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ] as const;

  return labels.map((label, index) => ({
    label,
    date: addDays(weekStart, index),
  }));
}

export function getGamesForWeek<T extends { raw?: { scheduledDate?: unknown }; scheduledAt?: number }>(
  games: T[],
  reference = new Date()
): T[] {
  const start = startOfWeek(reference, WEEK_OPTS);
  const end = endOfWeek(reference, WEEK_OPTS);
  return games.filter((game) => {
    const date = getGameScheduledDate(game);
    if (!date) return false;
    return isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) });
  });
}

export function getGamesGroupedByWeekDay<T extends { raw?: { scheduledDate?: unknown }; scheduledAt?: number }>(
  games: T[],
  reference = new Date()
) {
  return getCurrentWeekDays(reference).map(({ label, date }) => ({
    day: label,
    date,
    games: getGamesForDay(games, date),
  }));
}

export function getGamesForMonth<T extends { raw?: { scheduledDate?: unknown }; scheduledAt?: number }>(
  games: T[],
  reference: Date
): T[] {
  const start = startOfMonth(reference);
  const end = endOfMonth(reference);
  return games.filter((game) => {
    const date = getGameScheduledDate(game);
    if (!date) return false;
    return (
      isSameMonth(date, reference) &&
      isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) })
    );
  });
}
