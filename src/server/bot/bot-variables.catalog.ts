export type BotVariableCategory =
  | "global"
  | "args"
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
    key: "{sender}",
    label: "Quem digitou (alias)",
    description:
      "Equivalente a {displayName}. Use ao migrar comandos do StreamElements (${sender}).",
    usage: "{sender} meteu Hugs em {1}",
    category: "global",
    example: "fantonlord",
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
    "Timers disparam a cada X minutos desde o início da live (ex.: 21:05, 21:10 com intervalo 5 min). Referência para organização na admin.",
  usage: "Lembrete PIX a cada 5 min de live",
  category: "timer",
};

export const BOT_CATEGORY_LABELS: Record<BotVariableCategory, string> = {
  global: "Globais",
  args: "Argumentos do comando",
  counter: "Contadores",
  timer: "Timers",
  meta: "Runtime (bot)",
};

/** Placeholders preenchidos pelo bot ao montar responseTemplate dos comandos padrão. */
export const BOT_RUNTIME_TEMPLATE_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{uptime}",
    label: "Tempo de live",
    description: "Duração formatada desde o início da transmissão.",
    usage: "A live está no ar há {uptime}.",
    category: "meta",
    example: "2h 15min",
  },
  {
    key: "{followage}",
    label: "Tempo seguindo",
    description: "Há quanto tempo o usuário segue o canal.",
    usage: "Você segue há {followage}.",
    category: "meta",
    example: "3 meses",
  },
  {
    key: "{game}",
    label: "Jogo/categoria",
    description: "Categoria ou jogo atual da live.",
    usage: "Estamos em {game}.",
    category: "meta",
  },
  {
    key: "{gameDuration}",
    label: "Tempo na categoria",
    description: "Tempo na categoria/jogo atual.",
    usage: "Já faz {gameDuration} nessa categoria.",
    category: "meta",
    example: "45 min",
  },
  {
    key: "{title}",
    label: "Título da live",
    description: "Título atual da transmissão.",
    usage: "Título: {title}",
    category: "meta",
  },
  {
    key: "{viewers}",
    label: "Espectadores",
    description: "Contagem atual de viewers.",
    usage: "Temos {viewers} assistindo.",
    category: "meta",
  },
  {
    key: "{accountage}",
    label: "Idade da conta",
    description: "Tempo desde a criação da conta Twitch do usuário.",
    usage: "Conta criada há {accountage}.",
    category: "meta",
  },
  {
    key: "{firstChatter}",
    label: "Primeiro do dia",
    description: "Quem falou primeiro no chat no dia.",
    usage: "Hoje quem abriu foi {firstChatter}.",
    category: "meta",
  },
  {
    key: "{watchtime}",
    label: "Watchtime",
    description: "Tempo total assistindo ao canal.",
    usage: "Você já passou {watchtime} aqui.",
    category: "meta",
  },
  {
    key: "{rank}",
    label: "Ranking",
    description: "Posição no ranking de presença.",
    usage: "Você está em #{rank}.",
    category: "meta",
  },
  {
    key: "{commandList}",
    label: "Lista de comandos",
    description: "Triggers ativos resumidos para !comandos.",
    usage: "{commandList}",
    category: "meta",
  },
  {
    key: "{clipResponse}",
    label: "Resposta do clip",
    description: "Corpo retornado pela API FyreWire ao criar clip.",
    usage: "{clipResponse}",
    category: "meta",
  },
  {
    key: "{argsSummary}",
    label: "Resumo dos argumentos",
    description: "Texto humanizado dos args do comando (confirmação mod/streamer).",
    usage: "Confirmar {argsSummary}?",
    category: "meta",
  },
  {
    key: "{targetUser}",
    label: "Usuário alvo",
    description: "Login ou display name do alvo (@mod, duelo, ban…).",
    usage: "Ação em {targetUser}.",
    category: "meta",
  },
  {
    key: "{targetChannel}",
    label: "Canal alvo",
    description: "Canal de destino (raid).",
    usage: "Raid para {targetChannel}.",
    category: "meta",
  },
  {
    key: "{duration}",
    label: "Duração",
    description: "Segundos ou tempo formatado (timeout, slow, ad…).",
    usage: "Timeout de {duration}.",
    category: "meta",
  },
  {
    key: "{diceResult}",
    label: "Resultado do dado",
    description: "Número 1–6 do !dado.",
    usage: "Caiu {diceResult}!",
    category: "meta",
  },
  {
    key: "{userChoice}",
    label: "Escolha do usuário",
    description: "Argumento escolhido (moeda, jokenpo…).",
    usage: "Você escolheu {userChoice}.",
    category: "meta",
  },
  {
    key: "{coinResult}",
    label: "Resultado moeda",
    description: "cara ou coroa sorteado.",
    usage: "Deu {coinResult}!",
    category: "meta",
  },
  {
    key: "{coinOutcome}",
    label: "Desfecho moeda",
    description: "Frase amigável se ganhou ou perdeu.",
    usage: "{coinOutcome}",
    category: "meta",
  },
  {
    key: "{botChoice}",
    label: "Escolha do bot",
    description: "Jogada do bot no jokenpo.",
    usage: "Bot: {botChoice}.",
    category: "meta",
  },
  {
    key: "{jokenpoOutcome}",
    label: "Desfecho jokenpo",
    description: "Vitória, derrota ou empate humanizado.",
    usage: "{jokenpoOutcome}",
    category: "meta",
  },
  {
    key: "{rouletteResult}",
    label: "Resultado roleta",
    description: "Valor sorteado na roleta de pontos.",
    usage: "Parou em {rouletteResult}.",
    category: "meta",
  },
  {
    key: "{rouletteOutcome}",
    label: "Desfecho roleta",
    description: "Ganho/perda de pontos humanizado.",
    usage: "{rouletteOutcome}",
    category: "meta",
  },
  {
    key: "{dueloResult}",
    label: "Desfecho duelo",
    description: "Resultado do duelo de pontos.",
    usage: "{dueloResult}",
    category: "meta",
  },
  {
    key: "{pollResult}",
    label: "Resultado enquete",
    description: "Confirmação ou status da poll Helix.",
    usage: "{pollResult}",
    category: "meta",
  },
  {
    key: "{predictionResult}",
    label: "Resultado previsão",
    description: "Confirmação ou status da prediction Helix.",
    usage: "{predictionResult}",
    category: "meta",
  },
];
