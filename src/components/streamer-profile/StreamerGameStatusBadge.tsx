import { cn } from "@/lib/utils";
import {
  statusLabel,
  type KanbanStatus,
} from "@/components/admin/games/kanban-config";

const STATUS_CLASS: Record<KanbanStatus, string> = {
  to_play: "streamer-game-status-badge--to-play",
  playing: "streamer-game-status-badge--playing",
  finished: "streamer-game-status-badge--finished",
  dropped: "streamer-game-status-badge--dropped",
};

export function StreamerGameStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status as KanbanStatus;
  const label = STATUS_CLASS[key] ? statusLabel(key) : status;

  return (
    <span
      className={cn(
        "streamer-game-status-badge",
        STATUS_CLASS[key],
        className
      )}
    >
      {label}
    </span>
  );
}
