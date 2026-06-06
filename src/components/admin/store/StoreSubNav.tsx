"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ClipboardList,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const storeNavItems = [
  {
    href: "/admin/loja",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/admin/loja",
  },
  {
    href: "/admin/loja/produtos",
    label: "Produtos",
    icon: Package,
    match: (path: string) => path.startsWith("/admin/loja/produtos"),
  },
  {
    href: "/admin/loja/categorias",
    label: "Categorias",
    icon: FolderOpen,
    match: (path: string) => path.startsWith("/admin/loja/categorias"),
  },
  {
    href: "/admin/loja/resgates",
    label: "Resgates",
    icon: ClipboardList,
    match: (path: string) => path.startsWith("/admin/loja/resgates"),
  },
  {
    href: "/admin/loja/configuracoes",
    label: "Configurações",
    icon: Settings,
    match: (path: string) => path.startsWith("/admin/loja/configuracoes"),
  },
] as const;

export function StoreSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-1"
      aria-label="Seções da Loja"
    >
      {storeNavItems.map(({ href, label, icon: Icon, match }) => {
        const isActiveRoute = match(pathname ?? "");
        return (
          <Link
            key={href}
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
