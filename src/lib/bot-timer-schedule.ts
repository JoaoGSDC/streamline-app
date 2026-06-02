/** Modo de agendamento persistido em `bot_timers.schedule_mode`. */
export const BOT_TIMER_SCHEDULE_LIVE_ELAPSED = "live_elapsed" as const;

export type BotTimerScheduleMode = typeof BOT_TIMER_SCHEDULE_LIVE_ELAPSED;

export const BOT_TIMER_SCHEDULE_LABELS: Record<BotTimerScheduleMode, string> = {
  live_elapsed: "A cada X minutos desde o início da live",
};

export function resolveFirstRunAfterMinutes(
  intervalMinutes: number,
  firstRunAfterMinutes?: number | null
): number {
  if (
    firstRunAfterMinutes != null &&
    Number.isFinite(firstRunAfterMinutes) &&
    firstRunAfterMinutes > 0
  ) {
    return firstRunAfterMinutes;
  }
  return intervalMinutes;
}

/** Ex.: live 21:00, intervalo 5, primeira em 5 → "21:05, 21:10, 21:15…" */
export function formatLiveTimerPreview(
  intervalMinutes: number,
  firstRunAfterMinutes: number,
  sampleStartHour = 21,
  sampleStartMinute = 0,
  slots = 3
): string {
  const times: string[] = [];
  let totalMinutes =
    sampleStartHour * 60 + sampleStartMinute + firstRunAfterMinutes;

  for (let index = 0; index < slots; index += 1) {
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    times.push(
      `${String(hour).padStart(2, "0")}h${String(minute).padStart(2, "0")}`
    );
    totalMinutes += intervalMinutes;
  }

  return times.join(", ") + "…";
}
