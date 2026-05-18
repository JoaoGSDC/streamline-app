export type StreamerGameStatus = "to_play" | "playing" | "finished" | "dropped";

export function clampRating(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.min(10, Math.max(0, Math.round(n * 10) / 10));
}

export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function resolveDatesForCreate(
  status: StreamerGameStatus,
  overrides?: {
    startedAt?: Date | string | null;
    finishedAt?: Date | string | null;
  }
) {
  const now = new Date();
  if (status === "finished" || status === "dropped") {
    return {
      startedAt: toDate(overrides?.startedAt) ?? now,
      finishedAt: toDate(overrides?.finishedAt) ?? now,
    };
  }
  return {
    startedAt: toDate(overrides?.startedAt) ?? now,
    finishedAt: null as Date | null,
  };
}

/** Atualiza datas ao mudar status; mantém previsão ao ir para Jogando. */
export function resolveDatesOnStatusChange(
  previousStatus: StreamerGameStatus,
  nextStatus: StreamerGameStatus,
  current: {
    startedAt?: Date | string | null;
    finishedAt?: Date | string | null;
    rating?: number | null;
  },
  explicit?: {
    startedAt?: Date | string | null;
    finishedAt?: Date | string | null;
    rating?: number | null;
  }
) {
  const now = new Date();
  let startedAt = toDate(current.startedAt);
  let finishedAt = toDate(current.finishedAt);
  let rating =
    current.rating === null || current.rating === undefined
      ? null
      : clampRating(current.rating);

  if (nextStatus === "to_play") {
    startedAt = toDate(explicit?.startedAt) ?? now;
    finishedAt = null;
    rating = null;
  } else if (nextStatus === "playing") {
    if (previousStatus === "to_play" && startedAt) {
      // mantém previsão
    } else {
      startedAt = toDate(explicit?.startedAt) ?? now;
    }
    finishedAt = null;
    rating = null;
  } else if (nextStatus === "finished" || nextStatus === "dropped") {
    if (!startedAt) startedAt = now;
    finishedAt = toDate(explicit?.finishedAt) ?? now;
    if (explicit?.rating !== undefined) {
      rating = clampRating(explicit.rating);
    }
  }

  if (
    explicit?.startedAt != null &&
    (nextStatus === "to_play" || nextStatus === "playing")
  ) {
    startedAt = toDate(explicit.startedAt);
  }

  return { startedAt, finishedAt, rating };
}

export function formatGameDate(
  value: Date | string | null | undefined,
  locale = "pt-BR"
): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function finishedInYear(
  item: { status?: string; finishedAt?: Date | string | null },
  year: number
): boolean {
  if (item.status !== "finished" && item.status !== "dropped") return true;
  const d = toDate(item.finishedAt);
  if (!d) return false;
  return d.getFullYear() === year;
}
