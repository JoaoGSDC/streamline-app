"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarPlus,
  CircleDollarSign,
  Gamepad2,
  Home,
  Link2,
  ExternalLink,
  LogOut,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_BOT_CHILDREN,
  ADMIN_ECONOMY_CHILDREN,
  ADMIN_STORE_CHILDREN,
  type AdminNavChild,
} from "@/lib/admin-navigation";
import { AdminChannelSwitcher } from "./AdminChannelSwitcher";
import type { AdminChannel } from "./AdminProvider";

interface AdminSidebarProps {
  channels: AdminChannel[];
  actingAs: AdminChannel;
  onSwitchChannel: (streamerId: string) => Promise<void>;
  onLogout: () => void;
  className?: string;
  onNavigate?: () => void;
}

interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
  children?: AdminNavChild[];
}

const baseNavItems: NavItemConfig[] = [
  {
    href: "/admin",
    label: "Agendar Stream",
    icon: CalendarPlus,
    match: (path) => path === "/admin",
  },
  {
    href: "/admin/games",
    label: "Gerenciar Jogos",
    icon: Gamepad2,
    match: (path) => path.startsWith("/admin/games"),
  },
  {
    href: "/admin/links",
    label: "Link Page",
    icon: Link2,
    match: (path) => path.startsWith("/admin/links"),
  },
  {
    href: "/admin/loja",
    label: "Loja",
    icon: ShoppingBag,
    match: (path) => path.startsWith("/admin/loja"),
    children: ADMIN_STORE_CHILDREN,
  },
];

const ownerNavItems: NavItemConfig[] = [
  {
    href: "/admin/bot",
    label: "Bot",
    icon: Bot,
    match: (path) => path.startsWith("/admin/bot"),
    children: ADMIN_BOT_CHILDREN,
  },
  {
    href: "/admin/economia",
    label: "Pontuação",
    icon: CircleDollarSign,
    match: (path) => path.startsWith("/admin/economia"),
    children: ADMIN_ECONOMY_CHILDREN,
  },
  {
    href: "/admin/moderators",
    label: "Moderadores",
    icon: Users,
    match: (path) => path.startsWith("/admin/moderators"),
  },
];

function SidebarSubNav({
  items,
  pathname,
  onNavigate,
}: {
  items: AdminNavChild[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="admin-sidebar-subnav" role="group">
      {items.map((child) => {
        const childActive = child.match(pathname);
        return (
          <Link
            key={child.href}
            href={child.href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "admin-sidebar-subnav-link",
              childActive && "admin-sidebar-subnav-link--active"
            )}
            aria-current={childActive ? "page" : undefined}
          >
            {child.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AdminSidebar({
  channels,
  actingAs,
  onSwitchChannel,
  onLogout,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname() ?? "";
  const publicProfileUrl = `/${actingAs.twitchUsername}`;
  const isOwner = actingAs.role === "owner";

  const navItems = isOwner
    ? [...baseNavItems, ...ownerNavItems]
    : baseNavItems;

  return (
    <nav
      className={cn("flex h-full flex-col gap-0.5 p-3", className)}
      aria-label="Menu do painel"
    >
      <AdminChannelSwitcher
        channels={channels}
        actingAs={actingAs}
        onSwitch={onSwitchChannel}
        className="-mx-1 mb-1"
      />

      <div className="admin-sidebar-divider" role="separator" />

      <p className="mb-1.5 px-3 text-caption font-semibold uppercase tracking-wider">
        Painel
      </p>

      <div className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, match, children }) => {
          const active = match(pathname);
          const showChildren = Boolean(children?.length && active);

          return (
            <div key={href}>
              <Link
                href={href}
                prefetch
                onClick={onNavigate}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-md px-3 text-body-admin font-medium transition-colors",
                  active
                    ? "bg-[hsl(var(--sidebar-active-bg))] text-white"
                    : "text-muted-foreground hover:bg-surface-container-high/60 hover:text-foreground"
                )}
                aria-current={active && !showChildren ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>

              {showChildren ? (
                <SidebarSubNav
                  items={children!}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="admin-sidebar-divider" role="separator" />

      <Link
        href={publicProfileUrl}
        prefetch
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="flex h-9 items-center gap-3 rounded-md px-3 text-body-admin font-medium text-muted-foreground transition-colors hover:bg-surface-container-high/60 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        Ver Perfil Público
      </Link>

      <Link
        href="/"
        prefetch
        onClick={onNavigate}
        className="flex h-9 items-center gap-3 rounded-md px-3 text-body-admin font-medium text-muted-foreground transition-colors hover:bg-surface-container-high/60 hover:text-foreground"
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        Voltar ao Início
      </Link>

      <button
        type="button"
        onClick={onLogout}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-body-admin font-medium text-muted-foreground transition-colors hover:bg-surface-container-high/60 hover:text-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        Sair
      </button>
    </nav>
  );
}
