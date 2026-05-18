"use client";

import { useState } from "react";
import { Check, ChevronDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminChannel } from "@/components/admin/AdminProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function ChannelAvatar({
  channel,
  size = "md",
}: {
  channel: AdminChannel;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  if (channel.avatar) {
    return (
      <img
        src={channel.avatar}
        alt=""
        className={cn(dim, "shrink-0 rounded-full object-cover ring-2 ring-outline-variant/40")}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        "flex shrink-0 items-center justify-center rounded-full bg-primary-container/30 font-headline text-xs font-bold text-primary ring-2 ring-outline-variant/40"
      )}
    >
      {channel.name.charAt(0).toUpperCase()}
    </div>
  );
}

interface StreamerSwitcherMenuProps {
  channels: AdminChannel[];
  actingAs: AdminChannel;
  onSwitch: (streamerId: string) => Promise<void>;
  variant?: "sidebar" | "header";
  className?: string;
}

export function StreamerSwitcherMenu({
  channels,
  actingAs,
  onSwitch,
  variant = "header",
  className,
}: StreamerSwitcherMenuProps) {
  const [switching, setSwitching] = useState(false);

  const handleSelect = async (id: string) => {
    if (id === actingAs.id || switching) return;
    setSwitching(true);
    try {
      await onSwitch(id);
    } finally {
      setSwitching(false);
    }
  };

  const isHeader = variant === "header";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={switching}
          className={cn(
            "streamer-workspace-trigger h-auto gap-3 border-outline-variant/50 bg-surface-container-low/80 px-3 py-2 font-normal transition-colors hover:border-primary/40 hover:bg-surface-container-high/80",
            isHeader ? "min-w-[220px] justify-between" : "w-full justify-between",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <ChannelAvatar channel={actingAs} size={isHeader ? "md" : "sm"} />
            <span className="min-w-0 text-left">
              <span className="block truncate text-body-sm font-medium text-foreground">
                {actingAs.name}
              </span>
              <span className="block truncate text-caption text-muted-foreground">
                @{actingAs.twitchUsername}
              </span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isHeader ? "end" : "start"}
        className="autocomplete-dropdown w-72 p-1"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Gerenciar como
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {channels.map((channel) => {
          const active = channel.id === actingAs.id;
          return (
            <DropdownMenuItem
              key={channel.id}
              onClick={() => handleSelect(channel.id)}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5"
            >
              <ChannelAvatar channel={channel} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{channel.name}</span>
                  {channel.role === "moderator" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-container/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      <Shield className="h-2.5 w-2.5" />
                      Mod
                    </span>
                  )}
                  {channel.role === "owner" && active && (
                    <span className="rounded-full bg-secondary-container/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-secondary">
                      Você
                    </span>
                  )}
                </span>
                <span className="block truncate text-caption text-muted-foreground">
                  @{channel.twitchUsername}
                </span>
              </span>
              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
