"use client";

import { useAdminContext } from "@/components/admin/AdminProvider";
import { StreamerSwitcherMenu } from "./StreamerSwitcherMenu";
interface StreamerWorkspaceSwitcherProps {
  className?: string;
}

/** Exibido no header das páginas admin quando o usuário modera mais de um canal */
export function StreamerWorkspaceSwitcher({
  className,
}: StreamerWorkspaceSwitcherProps) {
  const { channels, actingAs, switchChannel } = useAdminContext();

  if (!actingAs || channels.length <= 1) {
    return null;
  }

  return (
    <StreamerSwitcherMenu
      channels={channels}
      actingAs={actingAs}
      onSwitch={switchChannel}
      variant="header"
      className={className}
    />
  );
}
