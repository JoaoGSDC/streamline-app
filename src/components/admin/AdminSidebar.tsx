"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Home,
  LogOut,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getChildFeatures,
  getTopLevelFeatures,
  OWNER_ONLY_FEATURE_KEYS,
  type PanelFeature,
} from "@/config/panel-features";
import { isAdminPathActive } from "@features/admin/lib/panel-nav";
import { getPanelFeatureIcon } from "@features/admin/lib/panel-icons";
import { usePanelConfig } from "@/contexts/PanelConfigContext";
import { AdminChannelSwitcher } from "./AdminChannelSwitcher";
import { PlanIndicator } from "@/components/panel/PlanIndicator";
import type { AdminChannel } from "./AdminProvider";

const MODULES_WITH_SUBNAV = new Set(["bot", "economy", "store"]);

/** Não entra no loop principal — link fixo no rodapé. */
const SIDEBAR_UTILITY_FEATURE_KEYS = new Set(["panel_settings"]);

interface AdminSidebarProps {
  channels: AdminChannel[];
  actingAs: AdminChannel;
  onSwitchChannel: (streamerId: string) => Promise<void>;
  onLogout: () => void;
  className?: string;
  onNavigate?: () => void;
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
  const { isEnabled, isLoading } = usePanelConfig();
  const isOwner = actingAs.role === "owner";

  const topFeatures = getTopLevelFeatures().filter(
    (feature) => !SIDEBAR_UTILITY_FEATURE_KEYS.has(feature.key)
  );

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

      <PlanIndicator />

      <div className="admin-sidebar-divider" role="separator" />

      <p className="mb-1.5 px-3 text-caption font-semibold uppercase tracking-wider">
        Painel
      </p>

      <div className="flex-1 space-y-0.5">
        {!isLoading
          ? topFeatures.map((feature) => {
              if (OWNER_ONLY_FEATURE_KEYS.has(feature.key) && !isOwner) {
                return null;
              }
              if (!isEnabled(feature.key)) return null;

              const children = getChildFeatures(feature.key);
              const enabledChildren = children.filter(
                (child) => child.route && isEnabled(child.key)
              );
              const subItems = MODULES_WITH_SUBNAV.has(feature.key)
                ? enabledChildren
                : [];

              return (
                <SidebarItem
                  key={feature.key}
                  feature={feature}
                  subItems={subItems}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              );
            })
          : null}
      </div>

      <div className="admin-sidebar-divider my-2" role="separator" />

      <SidebarUtilityLinks
        actingAs={actingAs}
        isOwner={isOwner}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </nav>
  );
}

function SidebarItem({
  feature,
  subItems,
  pathname,
  onNavigate,
}: {
  feature: PanelFeature;
  subItems: PanelFeature[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const href = feature.route ?? "/admin";
  const Icon = getPanelFeatureIcon(feature.icon);
  const active = isAdminPathActive(pathname, href);
  const showSubNav = subItems.length > 0 && active;

  return (
    <div>
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
        aria-current={active && !showSubNav ? "page" : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {feature.label}
      </Link>

      {showSubNav ? (
        <div className="admin-sidebar-subnav" role="group">
          {subItems.map((child) => {
            const childHref = child.route!;
            const childActive = isAdminPathActive(pathname, childHref);
            return (
              <Link
                key={child.key}
                href={childHref}
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
      ) : null}
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  onNavigate,
  external,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onNavigate?: () => void;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onNavigate}
      className="flex h-9 items-center gap-3 rounded-md px-3 text-body-admin font-medium text-muted-foreground transition-colors hover:bg-surface-container-high/60 hover:text-foreground"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function SidebarUtilityLinks({
  actingAs,
  isOwner,
  onNavigate,
  onLogout,
}: {
  actingAs: AdminChannel;
  isOwner: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const publicProfileUrl = `/${actingAs.twitchUsername}`;

  return (
    <div className="space-y-0.5">
      {isOwner ? (
        <SidebarLink
          href="/admin/personalizacao"
          icon={Settings2}
          label="Personalizar painel"
          onNavigate={onNavigate}
        />
      ) : null}

      <SidebarLink
        href={publicProfileUrl}
        icon={ExternalLink}
        label="Ver Perfil Público"
        onNavigate={onNavigate}
        external
      />

      <SidebarLink
        href="/"
        icon={Home}
        label="Voltar ao Início"
        onNavigate={onNavigate}
      />

      <button
        type="button"
        onClick={onLogout}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-body-admin font-medium text-muted-foreground transition-colors hover:bg-surface-container-high/60 hover:text-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        Sair
      </button>
    </div>
  );
}
