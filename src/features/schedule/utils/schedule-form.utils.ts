import type { ScheduleFormLink, ScheduleSelectedGame } from "@features/schedule/types/schedule.types";

export function formatDateForInput(value: Date | string): string {
  const dateValue = new Date(value);
  const pad = (unit: number) => String(unit).padStart(2, "0");
  return `${dateValue.getFullYear()}-${pad(dateValue.getMonth() + 1)}-${pad(dateValue.getDate())}`;
}

export function coverUrlFromStored(image?: string | null): string | undefined {
  if (!image?.trim()) return undefined;
  if (image.startsWith("//")) return image;
  if (image.startsWith("http")) {
    try {
      const parsedUrl = new URL(image);
      return parsedUrl.pathname + parsedUrl.search;
    } catch {
      return image;
    }
  }
  return image.startsWith("/") ? image : `//${image.replace(/^\/+/, "")}`;
}

export function resetScheduleFormState(setters: {
  setSelectedGame: (game: ScheduleSelectedGame | null) => void;
  setIsCustomGame: (value: boolean) => void;
  setCustomGameTitle: (value: string) => void;
  setScheduledDate: (value: string) => void;
  setScheduledTime: (value: string) => void;
  setDuration: (value: string) => void;
  setLinks: (value: ScheduleFormLink[]) => void;
  setNotes: (value: string) => void;
}): void {
  setters.setSelectedGame(null);
  setters.setIsCustomGame(false);
  setters.setCustomGameTitle("");
  setters.setScheduledDate("");
  setters.setScheduledTime("");
  setters.setDuration("");
  setters.setLinks([{ url: "", name: "" }]);
  setters.setNotes("");
}

export function buildScheduleSubmitPayload(options: {
  isCustomGame: boolean;
  selectedGame: ScheduleSelectedGame | null;
  customGameTitle: string;
  streamerId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  links: ScheduleFormLink[];
  notes: string;
  isEditing: boolean;
  editingGameImage?: string | null;
  editingGameSynopsis?: string | null;
}) {
  const validLinks = options.links.filter((link) => link.url.trim());

  let gameImage: string | null = null;
  if (!options.isCustomGame && options.selectedGame?.cover?.url) {
    gameImage = `https:${options.selectedGame.cover.url}`;
  } else if (options.isEditing && options.editingGameImage) {
    gameImage = options.editingGameImage;
  }

  return {
    streamerId: options.streamerId,
    gameId: null as string | null,
    igdbGameId:
      !options.isCustomGame && options.selectedGame ? options.selectedGame.id : null,
    gameTitle: options.isCustomGame
      ? options.customGameTitle
      : options.selectedGame?.name,
    gameImage,
    gameSynopsis: !options.isCustomGame
      ? options.selectedGame?.summary ?? options.editingGameSynopsis ?? null
      : null,
    scheduledDate: `${options.scheduledDate}T${options.scheduledTime}:00`,
    scheduledTime: options.scheduledTime,
    duration: options.duration,
    links: validLinks.length > 0 ? validLinks : [],
    notes: options.notes.trim() || null,
  };
}
