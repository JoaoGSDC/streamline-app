export type BotBuiltinCategory =
  | "general"
  | "raffles"
  | "moderator"
  | "streamer";

export type BotBuiltinMinRole = "everyone" | "moderator" | "streamer";

export type BotBuiltinExecutionKind =
  | "static"
  | "runtime"
  | "mod_action"
  | "streamer_action";

export interface BotBuiltinCommandDefinition {
  key: string;
  trigger: string;
  /** Legado/admin: vazio para comandos não-estáticos. Nunca ecoar no chat. */
  defaultResponse: string;
  description: string;
  defaultCooldownSeconds: number;
  category: BotBuiltinCategory;
  executionKind: BotBuiltinExecutionKind;
  minRole: BotBuiltinMinRole;
  argsHint?: string;
  customizableResponse: boolean;
  runtimeNotes?: string;
  externalApiUrlTemplate?: string;
  /**
   * Molde humanizado que o bot deve montar/substituir antes de enviar ao chat.
   * Comandos estáticos usam `defaultResponse`; runtime/mod/streamer usam isto.
   */
  responseTemplate?: string;
  /** Mod/streamer: pedir sim/não antes de executar. */
  requiresConfirmation?: boolean;
  /** Mensagem exibida ao pedir confirmação (placeholders: {displayName}, {trigger}, {argsSummary}). */
  confirmationPrompt?: string;
  /** Comando !daily / !early — chave enviada em POST .../live-rewards/claim */
  economyRewardKey?: "daily" | "early";
  /** Pontos padrão da recompensa (espelha economy-live-rewards.ts) */
  economyRewardPoints?: number;
  /** Comando !pontos — consulta saldo via GET .../balance */
  economyBalanceCommand?: boolean;
}

export const BOT_BUILTIN_CATEGORY_LABELS: Record<BotBuiltinCategory, string> = {
  general: "Gerais",
  raffles: "Sorteios e interação",
  moderator: "Moderadores",
  streamer: "Streamer",
};

export const BOT_BUILTIN_CATEGORY_ORDER: BotBuiltinCategory[] = [
  "general",
  "raffles",
  "moderator",
  "streamer",
];

export const DEPRECATED_BUILTIN_KEYS = [
  "discord",
  "redes",
  "youtube",
  "horarios",
] as const;

/** Texto legado gravado no banco — deve ser limpo e nunca enviado ao chat. */
export const LEGACY_RUNTIME_RESPONSE_PLACEHOLDER =
  "Resposta gerada automaticamente pelo bot em tempo real.";

export const DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT =
  "@{displayName}, você pediu {trigger}{argsSummary}. É isso mesmo? Responda sim ou não nos próximos 30 segundos.";

export const DEFAULT_CONFIRMATION_ACCEPT_WORDS = ["sim", "s", "yes", "y"] as const;
export const DEFAULT_CONFIRMATION_REJECT_WORDS = ["nao", "não", "n", "no"] as const;
export const DEFAULT_CONFIRMATION_TIMEOUT_SECONDS = 30;
