"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBotActivationContext } from "@features/bot/context/BotActivationContext";
import {
  LayoutDashboard,
  MessageSquare,
  Clock,
  Shield,
  BookOpen,
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
  {
    href: "/admin/bot/variables",
    label: "Variáveis",
    icon: BookOpen,
    match: (path: string) => path.startsWith("/admin/bot/variables"),
  },
] as const;

export function BotSubNav() {
  const pathname = usePathname();
  const { active, loading } = useBotActivationContext();

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-1"
      aria-label="Seções do Bot"
    >
      {botNavItems.map(({ href, label, icon: Icon, match }) => {
        const isActiveRoute = match(pathname ?? "");
        const isDashboard = href === "/admin/bot";
        const disabled = !loading && !active && !isDashboard;

        if (disabled) {
          return (
            <span
              key={href}
              aria-disabled="true"
              title="Ative o bot para acessar esta seção"
              className={cn(
                "flex shrink-0 cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium",
                "text-muted-foreground/50"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium transition-colors",
              isActiveRoute
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
