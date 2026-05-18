"use client";

import { cn } from "@/lib/utils";
import type { AdminChannel } from "./AdminProvider";
import { StreamerSwitcherMenu } from "./shared/StreamerSwitcherMenu";

interface AdminChannelSwitcherProps {
  channels: AdminChannel[];
  actingAs: AdminChannel;
  onSwitch: (streamerId: string) => Promise<void>;
  className?: string;
}

export function AdminChannelSwitcher({
  channels,
  actingAs,
  onSwitch,
  className,
}: AdminChannelSwitcherProps) {
  if (channels.length <= 1) {
    return (
      <div className={cn("px-3 py-2", className)}>
        <p className="font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Canal
        </p>
        <p className="mt-1 truncate text-body-sm font-medium text-foreground">
          @{actingAs.twitchUsername}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("px-2 pb-2", className)}>
      <p className="mb-1.5 px-1 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Canal ativo
      </p>
      <StreamerSwitcherMenu
        channels={channels}
        actingAs={actingAs}
        onSwitch={onSwitch}
        variant="sidebar"
      />
    </div>
  );
}
