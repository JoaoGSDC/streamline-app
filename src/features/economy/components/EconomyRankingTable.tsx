"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { EconomyRankingEntryDto } from "@server/economy/economy.types";

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

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function twitchAvatarUrl(username: string) {
  return `https://unavatar.io/twitch/${username}`;
}

interface EconomyRankingTableProps {
  items: EconomyRankingEntryDto[];
}

export function EconomyRankingTable({ items }: EconomyRankingTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
      <table className="economy-users-table w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/20 text-caption text-muted-foreground">
            <th className="w-14 px-3 py-2 font-medium" scope="col">
              #
            </th>
            <th className="w-12 px-3 py-2 font-medium" scope="col">
              <span className="sr-only">Avatar</span>
            </th>
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
              Última atividade
            </th>
            <th className="w-8 px-2 py-2" scope="col">
              <span className="sr-only">Expandir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry, index) => {
            const expanded = expandedId === entry.twitchUserId;
            const levelLabel = entry.levelTitle
              ? `${entry.level} · ${entry.levelTitle}`
              : String(entry.level);

            return (
              <Fragment key={entry.twitchUserId}>
                <tr
                  className={cn(
                    "economy-ranking-row h-11 border-b border-outline-variant/10",
                    index % 2 === 1 && "bg-muted/20",
                    expanded && "economy-ranking-row--expanded"
                  )}
                  onClick={() => toggleRow(entry.twitchUserId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleRow(entry.twitchUserId);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={expanded}
                >
                  <td className="px-3 py-0 align-middle font-mono text-muted-foreground">
                    {entry.position}
                  </td>
                  <td className="px-3 py-0 align-middle">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={twitchAvatarUrl(entry.twitchUsername)}
                        alt=""
                      />
                      <AvatarFallback className="text-[10px]">
                        {entry.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-3 py-0 align-middle">
                    <div className="font-medium">{entry.displayName}</div>
                    <div className="text-caption">@{entry.twitchUsername}</div>
                  </td>
                  <td className="px-3 py-0 align-middle tabular-nums">
                    {entry.points.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-0 align-middle">{levelLabel}</td>
                  <td className="px-3 py-0 align-middle text-muted-foreground">
                    {formatActivity(entry.lastActivityAt)}
                  </td>
                  <td className="px-2 py-0 align-middle">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        expanded && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-outline-variant/10 bg-muted/10">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="grid gap-2 text-label sm:grid-cols-3">
                        <p>
                          <span className="text-muted-foreground">XP total:</span>{" "}
                          {entry.xp.toLocaleString("pt-BR")}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Última atividade:
                          </span>{" "}
                          {formatActivity(entry.lastActivityAt)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            No canal desde:
                          </span>{" "}
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
