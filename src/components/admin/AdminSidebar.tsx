"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  Gamepad2,
  Home,
  Link2,
  ExternalLink,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminChannelSwitcher } from "./AdminChannelSwitcher";
import type { AdminChannel } from "./AdminProvider";

interface AdminSidebarProps {
  channels: AdminChannel[];
  actingAs: AdminChannel;
  onSwitchChannel: (streamerId: string) => Promise<void>;
  className?: string;
  onNavigate?: () => void;
}

const baseNavItems = [
  {
    href: "/admin",
    label: "Agendar Stream",
    icon: CalendarPlus,
    match: (path: string) => path === "/admin",
  },
  {
    href: "/admin/games",
    label: "Gerenciar Jogos",
    icon: Gamepad2,
    match: (path: string) => path.startsWith("/admin/games"),
  },
  {
    href: "/admin/links",
    label: "Link Page",
    icon: Link2,
    match: (path: string) => path.startsWith("/admin/links"),
  },
] as const;

export function AdminSidebar({
  channels,
  actingAs,
  onSwitchChannel,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const publicProfileUrl = `/${actingAs.twitchUsername}`;
  const isOwner = actingAs.role === "owner";

  const navItems = isOwner
    ? [
        ...baseNavItems,
        {
          href: "/admin/moderators",
          label: "Moderadores",
          icon: Users,
          match: (path: string) => path.startsWith("/admin/moderators"),
        },
      ]
    : baseNavItems;

  return (
    <nav
      className={cn("flex h-full flex-col gap-1 p-3", className)}
      aria-label="Menu do painel"
    >
      <AdminChannelSwitcher
        channels={channels}
        actingAs={actingAs}
        onSwitch={onSwitchChannel}
        className="-mx-1 mb-1"
      />

      <hr className="mb-2 border-0 h-px bg-outline-variant/40" />

      <p className="mb-2 px-3 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Painel
      </p>

      {navItems.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname ?? "");
        return (
          <Link
            key={href}
            href={href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium transition-colors",
              active
                ? "bg-primary-container/30 text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}

      <hr className="my-3 border-0 h-px bg-outline-variant/40" />

      <Link
        href={publicProfileUrl}
        prefetch
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        Ver Perfil Público
      </Link>

      <Link
        href="/"
        prefetch
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        Voltar ao Início
      </Link>
    </nav>
  );
}
