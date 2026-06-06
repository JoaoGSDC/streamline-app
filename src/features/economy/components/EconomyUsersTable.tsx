"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";

function formatActivity(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EconomyUsersTableProps {
  items: ChannelViewerEconomyDto[];
  savingIds: Set<string>;
  onEdit: (user: ChannelViewerEconomyDto) => void;
}

export function EconomyUsersTable({
  items,
  savingIds,
  onEdit,
}: EconomyUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="economy-users-table w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="px-3 py-2 font-medium" scope="col">
              Usuário
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Pontos
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Nível
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Atividade
            </th>
            <th className="w-20 px-3 py-2 text-right font-medium" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((user, index) => {
            const levelLabel = user.levelTitle
              ? `${user.level} · ${user.levelTitle}`
              : String(user.level);
            const saving = savingIds.has(user.id);

            return (
              <tr
                key={user.id}
                className={cn(
                  "h-11 border-b border-outline-variant/10 last:border-b-0",
                  index % 2 === 1 && "bg-muted/20"
                )}
              >
                <td className="px-3 py-0 align-middle">
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-caption">@{user.twitchUsername}</div>
                </td>
                <td className="px-3 py-0 align-middle tabular-nums">
                  {user.points.toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-0 align-middle">{levelLabel}</td>
                <td className="px-3 py-0 align-middle text-muted-foreground">
                  {formatActivity(user.lastActivityAt)}
                </td>
                <td className="px-3 py-0 align-middle text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={saving}
                    onClick={() => onEdit(user)}
                    aria-label={`Editar ${user.displayName}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
