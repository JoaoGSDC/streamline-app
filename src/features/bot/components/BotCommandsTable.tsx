"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  canOpenCommandEditor,
  getCommandCategoryShort,
  getResponsePreview,
  isAutomaticCommand,
  type BotCommandRowState,
} from "@features/bot/types/bot-command.types";

function truncateText(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

interface BotCommandsTableProps {
  rows: BotCommandRowState[];
  savingIds: Set<string>;
  onToggleEnabled: (row: BotCommandRowState, enabled: boolean) => void;
  onEdit: (row: BotCommandRowState) => void;
}

export function BotCommandsTable({
  rows,
  savingIds,
  onToggleEnabled,
  onEdit,
}: BotCommandsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="bot-commands-table w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="w-8 px-3 py-2 font-medium" scope="col">
              <span className="sr-only">Tipo</span>
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Comando
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Resposta
            </th>
            <th className="w-28 px-3 py-2 text-right font-medium" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const preview = getResponsePreview(row);
            const automatic = isAutomaticCommand(row);
            const editable = canOpenCommandEditor(row);
            const saving = savingIds.has(row.id);

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
                      row.isBuiltin
                        ? "bg-[hsl(var(--type-dot-builtin))]"
                        : "bg-[hsl(var(--type-dot-custom))]"
                    )}
                    aria-label={row.isBuiltin ? "Comando padrão" : "Comando personalizado"}
                  />
                </td>
                <td className="px-3 py-0 align-middle">
                  <div className="min-w-0">
                    <code className="font-mono text-body-admin text-foreground">
                      {row.trigger || "!novo"}
                    </code>
                    <p className="text-caption leading-tight">
                      {getCommandCategoryShort(row)}
                      {row.isDraft ? " · Rascunho" : ""}
                    </p>
                  </div>
                </td>
                <td className="max-w-0 px-3 py-0 align-middle">
                  {automatic ? (
                    <span className="inline-flex rounded-full border border-outline-variant/30 px-2 py-0.5 text-caption text-muted-foreground">
                      Automático
                    </span>
                  ) : preview ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate text-body-admin text-muted-foreground">
                          {truncateText(preview)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm break-words">
                        {preview}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-caption text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-0 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    {editable && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(row)}
                        aria-label={`Editar ${row.trigger}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Switch
                      checked={row.enabled}
                      disabled={saving}
                      onCheckedChange={(enabled) => onToggleEnabled(row, enabled)}
                      aria-label={`Ativar ${row.trigger}`}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
