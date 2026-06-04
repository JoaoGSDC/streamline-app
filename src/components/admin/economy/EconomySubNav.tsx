"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const economyNavItems = [
  {
    href: "/admin/economia",
    label: "Visão Geral",
    icon: LayoutDashboard,
    match: (path: string) => path === "/admin/economia",
  },
  {
    href: "/admin/economia/pontos",
    label: "Pontos",
    icon: Coins,
    match: (path: string) => path.startsWith("/admin/economia/pontos"),
  },
  {
    href: "/admin/economia/niveis",
    label: "Níveis",
    icon: TrendingUp,
    match: (path: string) => path.startsWith("/admin/economia/niveis"),
  },
  {
    href: "/admin/economia/ranking",
    label: "Ranking",
    icon: Trophy,
    match: (path: string) => path.startsWith("/admin/economia/ranking"),
  },
  {
    href: "/admin/economia/usuarios",
    label: "Usuários",
    icon: Users,
    match: (path: string) => path.startsWith("/admin/economia/usuarios"),
  },
] as const;

export function EconomySubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-1"
      aria-label="Seções da Pontuação"
    >
      {economyNavItems.map(({ href, label, icon: Icon, match }) => {
        const isActiveRoute = match(pathname ?? "");
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
