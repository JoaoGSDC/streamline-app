"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  BotBlacklistAction,
  BotBlacklistMatchType,
  BotBlacklistRecord,
} from "@services/entities/bot-blacklist.services";

type EditField = "term" | "matchType" | "action" | null;

interface BotBlacklistTableProps {
  rows: BotBlacklistRecord[];
  recentlyAddedIds: Set<string>;
  savingIds: Set<string>;
  onUpdate: (
    row: BotBlacklistRecord,
    patch: Partial<{
      term: string;
      matchType: BotBlacklistMatchType;
      action: BotBlacklistAction;
      timeoutSeconds: number;
    }>
  ) => Promise<boolean>;
  onToggleEnabled: (row: BotBlacklistRecord) => void;
  onDelete: (row: BotBlacklistRecord) => Promise<boolean>;
}

function MatchTypeChip({
  matchType,
  onClick,
}: {
  matchType: BotBlacklistMatchType;
  onClick: () => void;
}) {
  const isExact = matchType === "exact";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-caption font-medium transition-opacity hover:opacity-80",
        isExact
          ? "border-sky-500/25 bg-sky-500/15 text-sky-300"
          : "border-violet-500/25 bg-violet-500/15 text-violet-300"
      )}
    >
      {isExact ? "Exato" : "Contém"}
    </button>
  );
}

function formatAction(row: BotBlacklistRecord): string {
  if (row.action === "timeout") {
    return `Timeout ${row.timeoutSeconds ?? 60}s`;
  }
  return "Apagar";
}

export function BotBlacklistTable({
  rows,
  recentlyAddedIds,
  savingIds,
  onUpdate,
  onToggleEnabled,
  onDelete,
}: BotBlacklistTableProps) {
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(
    null
  );
  const [draftTerm, setDraftTerm] = useState("");
  const [draftAction, setDraftAction] = useState<BotBlacklistAction>("delete");
  const [draftTimeout, setDraftTimeout] = useState(60);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (recentlyAddedIds.size === 0) return;
    setAnimatingIds(new Set(recentlyAddedIds));
    const timer = window.setTimeout(() => setAnimatingIds(new Set()), 400);
    return () => window.clearTimeout(timer);
  }, [recentlyAddedIds]);

  const startEditTerm = (row: BotBlacklistRecord) => {
    setEditing({ id: row.id, field: "term" });
    setDraftTerm(row.term);
  };

  const saveTerm = async (row: BotBlacklistRecord) => {
    const trimmed = draftTerm.trim();
    setEditing(null);
    if (!trimmed || trimmed === row.term) return;
    await onUpdate(row, { term: trimmed });
  };

  const toggleMatchType = async (row: BotBlacklistRecord) => {
    const next: BotBlacklistMatchType =
      row.matchType === "exact" ? "contains" : "exact";
    await onUpdate(row, { matchType: next });
  };

  const startEditAction = (row: BotBlacklistRecord) => {
    setEditing({ id: row.id, field: "action" });
    setDraftAction(row.action);
    setDraftTimeout(row.timeoutSeconds ?? 60);
  };

  const saveAction = async (row: BotBlacklistRecord) => {
    setEditing(null);
    const patch =
      draftAction === "timeout"
        ? { action: draftAction, timeoutSeconds: draftTimeout }
        : { action: draftAction as BotBlacklistAction };
    if (
      row.action === patch.action &&
      (patch.action !== "timeout" || row.timeoutSeconds === patch.timeoutSeconds)
    ) {
      return;
    }
    await onUpdate(row, patch);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="px-3 py-2 font-medium" scope="col">
              Termo
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Correspondência
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Ação
            </th>
            <th className="w-14 px-3 py-2 text-center font-medium" scope="col">
              •
            </th>
            <th className="w-36 px-3 py-2 text-right font-medium" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const saving = savingIds.has(row.id);
            const isEditingTerm =
              editing?.id === row.id && editing.field === "term";
            const isEditingAction =
              editing?.id === row.id && editing.field === "action";
            const confirming = confirmDeleteId === row.id;

            return (
              <tr
                key={row.id}
                className={cn(
                  "h-11 border-b border-outline-variant/10 last:border-b-0",
                  index % 2 === 1 && "bg-muted/20",
                  animatingIds.has(row.id) && "blacklist-row-enter"
                )}
              >
                <td className="px-3 py-0 align-middle">
                  {isEditingTerm ? (
                    <Input
                      value={draftTerm}
                      autoFocus
                      disabled={saving}
                      onChange={(event) => setDraftTerm(event.target.value)}
                      onBlur={() => void saveTerm(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void saveTerm(row);
                        if (event.key === "Escape") setEditing(null);
                      }}
                      className="h-8 font-mono text-body-admin"
                      maxLength={100}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditTerm(row)}
                      className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-body-admin text-foreground hover:bg-muted"
                    >
                      {row.term}
                    </button>
                  )}
                </td>
                <td className="px-3 py-0 align-middle">
                  <MatchTypeChip
                    matchType={row.matchType}
                    onClick={() => void toggleMatchType(row)}
                  />
                </td>
                <td className="px-3 py-0 align-middle">
                  {isEditingAction ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={draftAction}
                        onValueChange={(value: BotBlacklistAction) =>
                          setDraftAction(value)
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delete">Apagar</SelectItem>
                          <SelectItem value="timeout">Timeout</SelectItem>
                        </SelectContent>
                      </Select>
                      {draftAction === "timeout" && (
                        <Input
                          type="number"
                          min={1}
                          value={draftTimeout}
                          onChange={(event) =>
                            setDraftTimeout(parseInt(event.target.value, 10) || 60)
                          }
                          className="h-8 w-16"
                        />
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-caption"
                        onClick={() => void saveAction(row)}
                      >
                        OK
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditAction(row)}
                      className="text-label text-muted-foreground hover:text-foreground"
                    >
                      {formatAction(row)}
                    </button>
                  )}
                </td>
                <td className="px-3 py-0 text-center align-middle">
                  <Switch
                    checked={row.enabled}
                    disabled={saving}
                    onCheckedChange={() => onToggleEnabled(row)}
                    aria-label={`Ativar termo ${row.term}`}
                  />
                </td>
                <td className="px-3 py-0 align-middle">
                  {confirming ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-caption text-muted-foreground">
                        Tem certeza?
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-caption"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2 text-caption"
                        disabled={saving}
                        onClick={() => {
                          void onDelete(row);
                          setConfirmDeleteId(null);
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(row.id)}
                        aria-label={`Excluir ${row.term}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
