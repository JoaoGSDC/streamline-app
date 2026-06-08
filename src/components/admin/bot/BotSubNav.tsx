"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBotActivationContext } from "@features/bot/context/BotActivationContext";
import { usePanelConfig } from "@/contexts/PanelConfigContext";
import {
  getVisibleChildFeatures,
  isAdminPathActive,
} from "@features/admin/lib/panel-nav";
import { getPanelFeatureIcon } from "@features/admin/lib/panel-icons";
import { cn } from "@/lib/utils";

export function BotSubNav() {
  const pathname = usePathname() ?? "";
  const { active, loading: botLoading } = useBotActivationContext();
  const { isLoading: configLoading, isEnabled } = usePanelConfig();

  const navItems = configLoading
    ? []
    : getVisibleChildFeatures("bot", isEnabled);

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-1"
      aria-label="Seções do Bot"
    >
      {navItems.map((item) => {
        const href = item.route!;
        const Icon = getPanelFeatureIcon(item.icon);
        const isActiveRoute = isAdminPathActive(pathname, href);
        const disabled = !botLoading && !active && href !== "/admin/bot";

        if (disabled) {
          return (
            <span
              key={item.key}
              aria-disabled="true"
              title="Ative o bot para acessar esta seção"
              className={cn(
                "flex h-9 shrink-0 cursor-not-allowed items-center gap-2 rounded-md px-3 text-body-admin font-medium",
                "text-muted-foreground/50"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={href}
            prefetch
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-body-admin font-medium transition-colors",
              isActiveRoute
                ? "bg-[hsl(var(--sidebar-active-bg))] text-white"
                : "text-muted-foreground hover:bg-surface-container-high/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
