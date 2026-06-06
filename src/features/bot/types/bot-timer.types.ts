export interface BotTimerRowState {
  id: string;
  name: string;
  intervalMinutes: number;
  firstRunAfterMinutes: number;
  scheduleMode: "live_elapsed";
  message: string;
  enabled: boolean;
  minViewers?: number | null;
  isDraft?: boolean;
  isNew?: boolean;
}

export function truncateTimerText(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
