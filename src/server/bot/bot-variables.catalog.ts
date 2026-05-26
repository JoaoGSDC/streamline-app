export type BotVariableCategory =
  | "global"
  | "counter"
  | "timer"
  | "meta";

export interface BotVariableDefinition {
  key: string;
  label: string;
  description: string;
  usage: string;
  category: BotVariableCategory;
  example?: string;
}

export const BOT_GLOBAL_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{user}",
    label: "Login de quem digitou",
    description:
      "Nome de usuário (login) de quem executou o comando no chat.",
    usage: "Olá {user}, bem-vindo!",
    category: "global",
    example: "viewer_br",
  },
  {
    key: "{displayName}",
    label: "Apelido no chat",
    description:
      "Nome exibido no chat da pessoa que digitou o comando (pode ter espaços e caracteres especiais).",
    usage: "Valeu pelo comando, {displayName}!",
    category: "global",
    example: "Viewer BR",
  },
  {
    key: "{channel}",
    label: "Nome do canal",
    description: "Login do canal Twitch onde o bot está ativo.",
    usage: "Você está no canal {channel}.",
    category: "global",
    example: "meucanal",
  },
  {
    key: "{streamer}",
    label: "Login do streamer",
    description: "Login Twitch do dono do canal (streamer).",
    usage: "Live do {streamer} começou!",
    category: "global",
    example: "meucanal",
  },
  {
    key: "{streamerName}",
    label: "Nome do streamer",
    description: "Nome público cadastrado do streamer na StreaminHub.",
    usage: "Apoie {streamerName} na live!",
    category: "global",
    example: "Meu Canal Oficial",
  },
  {
    key: "{count:<nome>}",
    label: "Valor de contador",
    description:
      "Substitui pelo valor atual de um contador. Troque <nome> pelo identificador do contador (ex.: vitórias).",
    usage: "Vitórias hoje: {count:vitorias}",
    category: "counter",
    example: "{count:vitorias} → 12",
  },
];

export const BOT_TIMER_VARIABLE_HINT: BotVariableDefinition = {
  key: "{timer:<nome>}",
  label: "Nome do timer (referência)",
  description:
    "Use o nome do timer nas mensagens automáticas. Timers não substituem variáveis em comandos até o bot suportar — exibido como referência.",
  usage: "Próximo lembrete: timer redes sociais",
  category: "timer",
};

export const BOT_CATEGORY_LABELS: Record<BotVariableCategory, string> = {
  global: "Globais",
  counter: "Contadores",
  timer: "Timers",
  meta: "Outros",
};
