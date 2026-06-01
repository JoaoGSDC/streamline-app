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
  defaultResponse: string;
  description: string;
  defaultCooldownSeconds: number;
  category: BotBuiltinCategory;
  executionKind: BotBuiltinExecutionKind;
  minRole: BotBuiltinMinRole;
  /** Sintaxe de argumentos exibida na admin (ex.: [cara/coroa]) */
  argsHint?: string;
  /** Permite editar a mensagem de resposta na admin */
  customizableResponse: boolean;
  /** Notas para implementação no serviço do bot */
  runtimeNotes?: string;
  /**
   * GET externo com `{channel}` no query (ex.: FyreWire clip).
   * O bot substitui `{channel}` pelo login Twitch do canal e envia o corpo da resposta ao chat.
   */
  externalApiUrlTemplate?: string;
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

export const RUNTIME_RESPONSE_PLACEHOLDER =
  "Resposta gerada automaticamente pelo bot em tempo real.";
