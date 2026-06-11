// src/config/panel-features.ts

export type PlanTier = "free" | "pro" | "enterprise";

export interface PanelFeature {
  key: string;
  label: string;
  description: string;
  icon: string;
  parentKey?: string;
  requiredPlan: PlanTier;
  defaultEnabled: boolean;
  route?: string;
  isComingSoon?: boolean;
  group?: string;
}

export const PANEL_FEATURES: PanelFeature[] = [
  {
    key: "stream_schedule",
    label: "Agendar Stream",
    description: "Planeje suas transmissões e gerencie sua agenda de lives.",
    icon: "calendar",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin",
  },
  {
    key: "games",
    label: "Gerenciar Jogos",
    description:
      "Biblioteca visual de jogos — kanban com para jogar, jogando, zerados.",
    icon: "gamepad-2",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/games",
  },
  {
    key: "links",
    label: "Link Page",
    description: "Monte sua página pública de links com templates e blocos.",
    icon: "link",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/links",
  },
  {
    key: "store",
    label: "Loja Virtual",
    description:
      "Loja de recompensas onde viewers resgatam produtos com pontos.",
    icon: "shopping-bag",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/loja",
  },
  {
    key: "quotes",
    label: "Quotes",
    description:
      "Memória histórica do canal — frases icônicas com contexto completo.",
    icon: "quote",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/quotes",
  },
  {
    key: "counters",
    label: "Contadores",
    description:
      "Métricas ao vivo para sua stream — mortes, metas, desafios e mais.",
    icon: "hash",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/contadores",
  },
  {
    key: "raffles",
    label: "Sorteios",
    description: "Realize sorteios ao vivo com o chat da Twitch.",
    icon: "confetti",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/sorteios",
  },
  {
    key: "bot",
    label: "Bot",
    description:
      "Configure o bot no chat da Twitch: comandos, timers e moderação.",
    icon: "bot",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/bot",
  },
  {
    key: "economy",
    label: "Pontuação",
    description: "Sistema de pontos e XP para recompensar viewers ativos.",
    icon: "coins",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/economia",
  },
  {
    key: "moderators",
    label: "Moderadores",
    description: "Delegue acesso ao painel para moderadores de confiança.",
    icon: "shield",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/moderators",
  },
  {
    key: "panel_settings",
    label: "Personalizar painel",
    description: "Escolha quais módulos e abas exibir no seu painel.",
    icon: "sliders-horizontal",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/personalizacao",
  },

  {
    key: "counters.list",
    label: "Meus Contadores",
    description: "Gerencie todos os contadores do canal.",
    icon: "hash",
    parentKey: "counters",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/contadores/lista",
  },
  {
    key: "counters.categories",
    label: "Categorias",
    description: "Organize contadores em categorias personalizadas.",
    icon: "folder",
    parentKey: "counters",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/contadores/categorias",
  },
  {
    key: "counters.history",
    label: "Histórico",
    description: "Auditoria de alterações nos contadores.",
    icon: "receipt",
    parentKey: "counters",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/contadores/historico",
  },
  {
    key: "counters.settings",
    label: "Configurações",
    description: "Ative o módulo e ajuste preferências.",
    icon: "settings-2",
    parentKey: "counters",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/contadores/configuracoes",
  },

  {
    key: "quotes.library",
    label: "Biblioteca",
    description: "Busque, crie e organize todas as quotes do canal.",
    icon: "quote",
    parentKey: "quotes",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/quotes/biblioteca",
  },
  {
    key: "quotes.categories",
    label: "Categorias",
    description: "Categorias personalizadas para organizar quotes.",
    icon: "folder",
    parentKey: "quotes",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/quotes/categorias",
  },
  {
    key: "quotes.settings",
    label: "Configurações",
    description: "Ative o módulo e ajuste captura automática de contexto.",
    icon: "settings-2",
    parentKey: "quotes",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/quotes/configuracoes",
  },

  {
    key: "bot.commands",
    label: "Comandos",
    description: "Gerencie comandos padrão e personalizados do bot.",
    icon: "terminal",
    parentKey: "bot",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/bot/commands",
  },
  {
    key: "bot.timers",
    label: "Timers",
    description: "Mensagens automáticas periódicas durante a live.",
    icon: "timer",
    parentKey: "bot",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/bot/timers",
  },
  {
    key: "bot.moderation",
    label: "Moderação",
    description: "Blacklist de termos e regras automáticas de moderação.",
    icon: "shield-check",
    parentKey: "bot",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/bot/moderation",
  },
  {
    key: "bot.variables",
    label: "Variáveis",
    description: "Referência completa de variáveis disponíveis nos comandos.",
    icon: "braces",
    parentKey: "bot",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/bot/variables",
  },

  {
    key: "economy.overview",
    label: "Visão Geral",
    description: "Dashboard de estatísticas do sistema de pontos.",
    icon: "layout-dashboard",
    parentKey: "economy",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/economia",
  },
  {
    key: "economy.points",
    label: "Configurar Pontos",
    description: "Regras de distribuição, multiplicadores e limites diários.",
    icon: "settings",
    parentKey: "economy",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/economia/pontos",
  },
  {
    key: "economy.levels",
    label: "Níveis e XP",
    description: "Sistema de progressão com XP, níveis e títulos customizados.",
    icon: "trending-up",
    parentKey: "economy",
    requiredPlan: "pro",
    defaultEnabled: false,
    route: "/admin/economia/niveis",
  },
  {
    key: "economy.ranking",
    label: "Ranking",
    description: "Top viewers por pontos com busca e paginação.",
    icon: "trophy",
    parentKey: "economy",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/economia/ranking",
  },
  {
    key: "economy.users",
    label: "Usuários",
    description: "Gerenciar saldo individual de pontos e coins por viewer.",
    icon: "users",
    parentKey: "economy",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/economia/usuarios",
  },

  {
    key: "store.products",
    label: "Produtos",
    description: "Cadastro e gestão de produtos da loja.",
    icon: "package",
    parentKey: "store",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/loja/produtos",
  },
  {
    key: "store.categories",
    label: "Categorias",
    description: "Organize produtos em categorias personalizadas.",
    icon: "folder",
    parentKey: "store",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/loja/categorias",
  },
  {
    key: "store.redemptions",
    label: "Resgates",
    description: "Gerenciar pedidos de resgate e atualizar status.",
    icon: "receipt",
    parentKey: "store",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/loja/resgates",
  },
  {
    key: "store.settings",
    label: "Configurações da Loja",
    description: "Ativar loja pública, modo de entrega e integração Pixie.",
    icon: "settings-2",
    parentKey: "store",
    requiredPlan: "free",
    defaultEnabled: true,
    route: "/admin/loja/configuracoes",
  },

  {
    key: "links.templates",
    label: "Templates",
    description: "Escolha o estilo visual base da sua Link Page.",
    icon: "layout-template",
    parentKey: "links",
    requiredPlan: "free",
    defaultEnabled: true,
  },
  {
    key: "links.visual",
    label: "Visual",
    description: "Personalize cores, fontes e fundo da página.",
    icon: "palette",
    parentKey: "links",
    requiredPlan: "free",
    defaultEnabled: true,
  },
  {
    key: "links.blocks",
    label: "Blocos",
    description: "Adicione e reordene blocos de conteúdo.",
    icon: "layout-grid",
    parentKey: "links",
    requiredPlan: "free",
    defaultEnabled: true,
  },
  {
    key: "links.links",
    label: "Links",
    description: "Gerencie seus links sociais e principais.",
    icon: "link-2",
    parentKey: "links",
    requiredPlan: "free",
    defaultEnabled: true,
  },

  {
    key: "analytics",
    label: "Analytics",
    description:
      "Métricas detalhadas de viewers, resgates, pontos e crescimento do canal.",
    icon: "bar-chart-3",
    requiredPlan: "pro",
    defaultEnabled: false,
    isComingSoon: true,
    route: "/admin/analytics",
  },
  {
    key: "emotes",
    label: "Emotes (7TV / BTTV)",
    description:
      "Gerencie emotes de plataformas externas diretamente no painel.",
    icon: "smile",
    requiredPlan: "pro",
    defaultEnabled: false,
    isComingSoon: true,
    route: "/admin/emotes",
  },
  {
    key: "overlays",
    label: "Overlays",
    description: "Crie e gerencie overlays interativos para o OBS.",
    icon: "monitor",
    requiredPlan: "pro",
    defaultEnabled: false,
    isComingSoon: true,
    route: "/admin/overlays",
  },
  {
    key: "bot.ai_responses",
    label: "Respostas com IA",
    description: "Bot responde perguntas dos viewers com IA contextualizada.",
    icon: "sparkles",
    parentKey: "bot",
    requiredPlan: "pro",
    defaultEnabled: false,
    isComingSoon: true,
  },
];

/** Módulos visíveis apenas para o dono do canal */
export const OWNER_ONLY_FEATURE_KEYS = new Set([
  "bot",
  "economy",
  "moderators",
  "panel_settings",
]);

export function getTopLevelFeatures(): PanelFeature[] {
  return PANEL_FEATURES.filter((f) => !f.parentKey);
}

export function getChildFeatures(parentKey: string): PanelFeature[] {
  return PANEL_FEATURES.filter((f) => f.parentKey === parentKey);
}

export function getFeature(key: string): PanelFeature | undefined {
  return PANEL_FEATURES.find((f) => f.key === key);
}

export function planSatisfies(userPlan: PlanTier, required: PlanTier): boolean {
  const hierarchy: PlanTier[] = ["free", "pro", "enterprise"];
  return hierarchy.indexOf(userPlan) >= hierarchy.indexOf(required);
}

/** Mapeia pathname admin → feature key (rota mais específica primeiro). */
export function resolveFeatureKeyForPath(pathname: string): string | null {
  const path = pathname.split("?")[0];
  const matches = PANEL_FEATURES.filter(
    (f) => f.route && (path === f.route || path.startsWith(`${f.route}/`))
  ).sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0));
  return matches[0]?.key ?? null;
}
