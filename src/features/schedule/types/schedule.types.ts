import type { AdminChannel } from "@/components/admin/AdminProvider";
import type { GameSearchResult } from "@features/search/types/search.types";

export interface ScheduleFormLink {
  url: string;
  name: string;
}

export interface ScheduleFormEditStream {
  id: string;
  streamerId: string;
  igdbGameId?: number | null;
  gameTitle?: string | null;
  gameImage?: string | null;
  gameSynopsis?: string | null;
  scheduledDate: Date | string;
  scheduledTime: string;
  duration: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string | null;
}

export interface ScheduleFormProps {
  formTarget: string;
  onFormTargetChange: (id: string) => void;
  ownerChannel: AdminChannel | null;
  moderatedChannels: AdminChannel[];
  resolveStreamerId: (formTarget: string) => string;
  editingStream?: ScheduleFormEditStream | null;
  onCancelEdit?: () => void;
  onSuccess: () => void;
}

export type ScheduleSelectedGame = GameSearchResult;
