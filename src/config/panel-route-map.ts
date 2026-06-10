/**
 * Mapeamento rota admin → feature key (middleware e guards).
 * Rotas mais específicas têm prioridade via resolveFeatureKeyForAdminPath.
 */
export const ROUTE_FEATURE_MAP: Record<string, string> = {
  "/admin": "stream_schedule",
  "/admin/games": "games",
  "/admin/links": "links",
  "/admin/loja": "store",
  "/admin/loja/produtos": "store.products",
  "/admin/loja/categorias": "store.categories",
  "/admin/loja/resgates": "store.redemptions",
  "/admin/loja/configuracoes": "store.settings",
  "/admin/contadores": "counters",
  "/admin/contadores/lista": "counters.list",
  "/admin/contadores/categorias": "counters.categories",
  "/admin/contadores/historico": "counters.history",
  "/admin/contadores/configuracoes": "counters.settings",
  "/admin/quotes": "quotes",
  "/admin/quotes/biblioteca": "quotes.library",
  "/admin/quotes/categorias": "quotes.categories",
  "/admin/quotes/configuracoes": "quotes.settings",
  "/admin/bot": "bot",
  "/admin/bot/commands": "bot.commands",
  "/admin/bot/timers": "bot.timers",
  "/admin/bot/moderation": "bot.moderation",
  "/admin/bot/variables": "bot.variables",
  "/admin/economia": "economy",
  "/admin/economia/pontos": "economy.points",
  "/admin/economia/niveis": "economy.levels",
  "/admin/economia/ranking": "economy.ranking",
  "/admin/economia/usuarios": "economy.users",
  "/admin/moderators": "moderators",
  "/admin/personalizacao": "panel_settings",
  "/admin/analytics": "analytics",
  "/admin/emotes": "emotes",
  "/admin/overlays": "overlays",
};

const ROUTE_ENTRIES = Object.entries(ROUTE_FEATURE_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

export function resolveFeatureKeyForAdminPath(pathname: string): string | null {
  const path = pathname.split("?")[0];

  for (const [route, featureKey] of ROUTE_ENTRIES) {
    if (route === "/admin") {
      if (path === "/admin") return featureKey;
      continue;
    }
    if (path === route || path.startsWith(`${route}/`)) {
      return featureKey;
    }
  }

  return null;
}
