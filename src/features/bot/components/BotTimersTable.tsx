"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  truncateTimerText,
  type BotTimerRowState,
} from "@features/bot/types/bot-timer.types";

interface BotTimersTableProps {
  rows: BotTimerRowState[];
  savingIds: Set<string>;
  onToggleEnabled: (row: BotTimerRowState, enabled: boolean) => void;
  onEdit: (row: BotTimerRowState) => void;
  onDelete: (row: BotTimerRowState) => void;
}

export function BotTimersTable({
  rows,
  savingIds,
  onToggleEnabled,
  onEdit,
  onDelete,
}: BotTimersTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="w-8 px-3 py-2 font-medium" scope="col">
              <span className="sr-only">Status</span>
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Nome/Mensagem
            </th>
            <th className="w-36 px-3 py-2 font-medium" scope="col">
              Intervalo
            </th>
            <th className="w-44 px-3 py-2 text-right font-medium" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const saving = savingIds.has(row.id);
            const hasName = Boolean(row.name.trim());
            const message = row.message.trim();
            const confirming = confirmDeleteId === row.id;

            return (
              <tr
                key={row.id}
                className={cn(
                  "h-11 border-b border-outline-variant/10 last:border-b-0",
                  index % 2 === 1 && "bg-muted/20"
                )}
              >
                <td className="px-3 py-0 align-middle">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 shrink-0 rounded-full",
                      row.enabled
                        ? "bg-[hsl(var(--status-online))]"
                        : "bg-[hsl(var(--type-dot-builtin))]"
                    )}
                    aria-label={row.enabled ? "Ativo" : "Inativo"}
                  />
                </td>
                <td className="max-w-0 px-3 py-0 align-middle">
                  {hasName ? (
                    <div className="min-w-0">
                      <p className="truncate text-body-admin text-foreground">
                        {row.name.trim()}
                        {row.isDraft ? (
                          <span className="ml-2 text-caption text-muted-foreground">
                            Rascunho
                          </span>
                        ) : null}
                      </p>
                      {message ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="truncate text-caption">
                              {truncateTimerText(message)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm break-words">
                            {message}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <p className="text-caption">Sem mensagem</p>
                      )}
                    </div>
                  ) : message ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="truncate text-body-admin text-foreground">
                          {truncateTimerText(message)}
                          {row.isDraft ? (
                            <span className="ml-2 text-caption text-muted-foreground">
                              Rascunho
                            </span>
                          ) : null}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm break-words">
                        {message}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <p className="text-body-admin text-muted-foreground">
                      Timer sem mensagem
                      {row.isDraft ? " · Rascunho" : ""}
                    </p>
                  )}
                </td>
                <td className="px-3 py-0 align-middle">
                  <span className="text-label text-muted-foreground">
                    a cada {row.intervalMinutes} min
                  </span>
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
                          onDelete(row);
                          setConfirmDeleteId(null);
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(row)}
                        aria-label={`Editar ${row.name || "timer"}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(row.id)}
                        aria-label={`Excluir ${row.name || "timer"}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={row.enabled}
                        disabled={saving}
                        onCheckedChange={(enabled) => onToggleEnabled(row, enabled)}
                        aria-label={`Ativar ${row.name || "timer"}`}
                      />
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
