"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePanelConfig } from "@/contexts/PanelConfigContext";
import {
  getVisibleChildFeatures,
  isAdminPathActive,
} from "@features/admin/lib/panel-nav";
import { getPanelFeatureIcon } from "@features/admin/lib/panel-icons";
import { cn } from "@/lib/utils";

export function StoreSubNav() {
  const pathname = usePathname() ?? "";
  const { isLoading: configLoading, isEnabled } = usePanelConfig();

  const navItems = configLoading
    ? []
    : getVisibleChildFeatures("store", isEnabled);

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-1"
      aria-label="Seções da Loja"
    >
      {navItems.map((item) => {
        const href = item.route!;
        const Icon = getPanelFeatureIcon(item.icon);
        const isActiveRoute = isAdminPathActive(pathname, href);

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
