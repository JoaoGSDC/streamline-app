export interface AdminNavChild {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export const ADMIN_BOT_CHILDREN: AdminNavChild[] = [
  {
    href: "/admin/bot",
    label: "Dashboard",
    match: (path) => path === "/admin/bot",
  },
  {
    href: "/admin/bot/commands",
    label: "Comandos",
    match: (path) => path.startsWith("/admin/bot/commands"),
  },
  {
    href: "/admin/bot/timers",
    label: "Timers",
    match: (path) => path.startsWith("/admin/bot/timers"),
  },
  {
    href: "/admin/bot/moderation",
    label: "Moderação",
    match: (path) => path.startsWith("/admin/bot/moderation"),
  },
  {
    href: "/admin/bot/variables",
    label: "Variáveis",
    match: (path) => path.startsWith("/admin/bot/variables"),
  },
];

export const ADMIN_ECONOMY_CHILDREN: AdminNavChild[] = [
  {
    href: "/admin/economia",
    label: "Visão Geral",
    match: (path) => path === "/admin/economia",
  },
  {
    href: "/admin/economia/pontos",
    label: "Pontos",
    match: (path) => path.startsWith("/admin/economia/pontos"),
  },
  {
    href: "/admin/economia/niveis",
    label: "Níveis",
    match: (path) => path.startsWith("/admin/economia/niveis"),
  },
  {
    href: "/admin/economia/ranking",
    label: "Ranking",
    match: (path) => path.startsWith("/admin/economia/ranking"),
  },
  {
    href: "/admin/economia/usuarios",
    label: "Usuários",
    match: (path) => path.startsWith("/admin/economia/usuarios"),
  },
];

export const ADMIN_STORE_CHILDREN: AdminNavChild[] = [
  {
    href: "/admin/loja",
    label: "Dashboard",
    match: (path) => path === "/admin/loja",
  },
  {
    href: "/admin/loja/produtos",
    label: "Produtos",
    match: (path) => path.startsWith("/admin/loja/produtos"),
  },
  {
    href: "/admin/loja/categorias",
    label: "Categorias",
    match: (path) => path.startsWith("/admin/loja/categorias"),
  },
  {
    href: "/admin/loja/resgates",
    label: "Resgates",
    match: (path) => path.startsWith("/admin/loja/resgates"),
  },
  {
    href: "/admin/loja/configuracoes",
    label: "Configurações",
    match: (path) => path.startsWith("/admin/loja/configuracoes"),
  },
];

interface AdminModuleConfig {
  prefix: string;
  label: string;
  href: string;
  children: AdminNavChild[];
}

const ADMIN_MODULES: AdminModuleConfig[] = [
  {
    prefix: "/admin/bot",
    label: "Bot",
    href: "/admin/bot",
    children: ADMIN_BOT_CHILDREN,
  },
  {
    prefix: "/admin/economia",
    label: "Pontuação",
    href: "/admin/economia",
    children: ADMIN_ECONOMY_CHILDREN,
  },
  {
    prefix: "/admin/loja",
    label: "Loja",
    href: "/admin/loja",
    children: ADMIN_STORE_CHILDREN,
  },
];

export function resolveAdminBreadcrumbs(
  pathname: string
): AdminBreadcrumbItem[] {
  const path = pathname.split("?")[0];

  for (const adminModule of ADMIN_MODULES) {
    if (!path.startsWith(adminModule.prefix)) continue;

    const child = adminModule.children.find((item) => item.match(path));
    if (!child || child.href === adminModule.href) return [];

    return [
      { label: adminModule.label, href: adminModule.href },
      { label: child.label },
    ];
  }

  return [];
}

export function getAdminModuleChildren(
  pathname: string
): AdminNavChild[] | null {
  const path = pathname.split("?")[0];

  for (const adminModule of ADMIN_MODULES) {
    if (path.startsWith(adminModule.prefix)) {
      return adminModule.children;
    }
  }

  return null;
}

export function isAdminModuleActive(
  pathname: string,
  prefix: string
): boolean {
  return pathname.split("?")[0].startsWith(prefix);
}
