"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const botNavItems = [
  {
    href: "/admin/bot",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/admin/bot",
  },
  {
    href: "/admin/bot/commands",
    label: "Comandos",
    icon: MessageSquare,
    match: (path: string) => path.startsWith("/admin/bot/commands"),
  },
  {
    href: "/admin/bot/timers",
    label: "Timers",
    icon: Clock,
    match: (path: string) => path.startsWith("/admin/bot/timers"),
  },
  {
    href: "/admin/bot/moderation",
    label: "Moderação",
    icon: Shield,
    match: (path: string) => path.startsWith("/admin/bot/moderation"),
  },
] as const;

export function BotSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-1"
      aria-label="Seções do Bot"
    >
      {botNavItems.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname ?? "");
        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium transition-colors",
              active
                ? "bg-primary-container/30 text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
