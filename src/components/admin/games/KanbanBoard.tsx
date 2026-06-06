"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Layers } from "lucide-react";
import {
  KanbanCard,
  type KanbanGameItem,
} from "./KanbanCard";
import { KANBAN_COLUMNS, type KanbanColumnKey } from "./kanban-config";

type DropTarget = { column: KanbanColumnKey; beforeId: string | null } | null;

interface KanbanBoardProps {
  columns: { key: KanbanColumnKey; title: string; items: KanbanGameItem[] }[];
  onDropAt: (
    columnKey: KanbanColumnKey,
    beforeId: string | null,
    draggedId: string
  ) => void;
  onEdit: (item: KanbanGameItem) => void;
  onRemove: (id: string) => void;
  onAddToColumn: (columnKey: KanbanColumnKey) => void;
  normalizeImageUrl: (raw?: string | null) => string;
  showStreamerBadge?: boolean;
  streamerLabels?: Record<string, string>;
  visibleColumnKeys: KanbanColumnKey[];
}

function DropSlot({
  active,
  onDragOver,
  onDrop,
}: {
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className={cn(
        "admin-kanban-drop-slot",
        active && "admin-kanban-drop-slot--active"
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-hidden
    />
  );
}

export function KanbanBoard({
  columns,
  onDropAt,
  onEdit,
  onRemove,
  onAddToColumn,
  normalizeImageUrl,
  showStreamerBadge,
  streamerLabels,
  visibleColumnKeys,
}: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const draggedIdRef = useRef<string | null>(null);

  const clearDrag = () => {
    setDraggedId(null);
    draggedIdRef.current = null;
    setDropTarget(null);
  };

  const isSlotActive = (column: KanbanColumnKey, beforeId: string | null) =>
    dropTarget?.column === column && dropTarget.beforeId === beforeId;

  const resolveDraggedId = (e: React.DragEvent) => {
    const fromData = e.dataTransfer.getData("text/plain");
    return fromData || draggedIdRef.current || draggedId || "";
  };

  const handleDragOverSlot = (
    e: React.DragEvent,
    column: KanbanColumnKey,
    beforeId: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ column, beforeId });
  };

  const handleDragOverColumn = (e: React.DragEvent, column: KanbanColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ column, beforeId: null });
  };

  const handleDrop = (
    e: React.DragEvent,
    column: KanbanColumnKey,
    beforeId: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const id = resolveDraggedId(e);
    if (id) onDropAt(column, beforeId, id);
    clearDrag();
  };

  const visibleColumns = KANBAN_COLUMNS.filter((meta) =>
    visibleColumnKeys.includes(meta.key)
  );

  return (
    <div className="admin-kanban-board">
      {visibleColumns.map((meta) => {
        const col = columns.find((c) => c.key === meta.key)!;
        const isColumnActive = dropTarget?.column === meta.key;

        return (
          <div
            key={meta.key}
            className={cn(
              "admin-kanban-column",
              isColumnActive && "admin-kanban-column--active"
            )}
          >
            <header className="admin-kanban-column-header">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: meta.accent,
                    boxShadow: `0 0 8px ${meta.accent}`,
                  }}
                />
                <h3 className="truncate text-label font-semibold text-foreground">
                  {meta.title} ({col.items.length})
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onAddToColumn(meta.key)}
                aria-label={`Adicionar jogo em ${meta.title}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </header>

            <div
              className="admin-kanban-column-body"
              onDragOver={(e) => handleDragOverColumn(e, meta.key)}
              onDrop={(e) => handleDrop(e, meta.key, null)}
            >
              {col.items.length === 0 && !draggedId ? (
                <AdminEmptyState
                  icon={Layers}
                  title={meta.emptyTitle}
                  description={meta.emptyHint}
                  className="py-6"
                />
              ) : null}

              {col.items.map((it) => (
                <div key={it.id} className="flex flex-col gap-2">
                  <DropSlot
                    active={isSlotActive(meta.key, it.id)}
                    onDragOver={(e) => handleDragOverSlot(e, meta.key, it.id)}
                    onDrop={(e) => handleDrop(e, meta.key, it.id)}
                  />
                  <KanbanCard
                    item={it}
                    isDragging={draggedId === it.id}
                    isDropped={meta.key === "dropped"}
                    onEdit={onEdit}
                    onRemove={onRemove}
                    normalizeImageUrl={normalizeImageUrl}
                    streamerLabel={
                      showStreamerBadge && it.streamerId
                        ? streamerLabels?.[it.streamerId]
                        : undefined
                    }
                    onDragStart={(id) => {
                      draggedIdRef.current = id;
                      setDraggedId(id);
                    }}
                    onDragEnd={clearDrag}
                  />
                </div>
              ))}

              <DropSlot
                active={isSlotActive(meta.key, null)}
                onDragOver={(e) => handleDragOverSlot(e, meta.key, null)}
                onDrop={(e) => handleDrop(e, meta.key, null)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
