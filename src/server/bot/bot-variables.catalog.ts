export type BotVariableCategory =
  | "global"
  | "args"
  | "counter"
  | "timer"
  | "meta"
  | "live"
  | "user"
  | "points"
  | "cooldown"
  | "random"
  | "datetime"
  | "usage"
  | "text"
  | "math"
  | "conditional";

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
  live: "Informações da live",
  user: "Informações do usuário",
  points: "Pontuação",
  cooldown: "Cooldown",
  random: "Randomização",
  datetime: "Data e hora",
  usage: "Uso do comando",
  text: "Manipulação de texto",
  math: "Matemática",
  conditional: "Condicional",
};

export const BOT_LIVE_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{game}",
    label: "Jogo atual",
    description: "Nome do jogo/categoria da live (requer Helix).",
    usage: "Jogando {game} agora!",
    category: "live",
    example: "Hollow Knight",
  },
  {
    key: "{title}",
    label: "Título da live",
    description: "Título atual da transmissão.",
    usage: "Título: {title}",
    category: "live",
    example: "Zeramento ao vivo!",
  },
  {
    key: "{uptime}",
    label: "Tempo de live",
    description: "Duração desde o início da transmissão.",
    usage: "Live há {uptime}",
    category: "live",
    example: "3h 42min",
  },
  {
    key: "{viewers}",
    label: "Espectadores",
    description: "Contagem atual de viewers.",
    usage: "{viewers} pessoas assistindo",
    category: "live",
    example: "127",
  },
  {
    key: "{language}",
    label: "Idioma da live",
    description: "Código do idioma configurado na transmissão.",
    usage: "Idioma: {language}",
    category: "live",
    example: "pt",
  },
];

export const BOT_USER_INFO_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{followsince}",
    label: "Data do follow",
    description: "Data em que o viewer começou a seguir o canal.",
    usage: "Seguindo desde {followsince}",
    category: "user",
    example: "12/03/2024",
  },
  {
    key: "{followage}",
    label: "Tempo seguindo",
    description: "Há quanto tempo o viewer segue o canal.",
    usage: "Você segue há {followage}",
    category: "user",
    example: "1 ano e 3 meses",
  },
  {
    key: "{submonths}",
    label: "Meses de inscrição",
    description: "Meses como inscrito (0 se não for sub).",
    usage: "Inscrito há {submonths} meses",
    category: "user",
    example: "8",
  },
  {
    key: "{ismod}",
    label: "É moderador",
    description: 'Retorna "mod" se for moderador, vazio caso contrário.',
    usage: "{ismod}",
    category: "user",
    example: "mod",
  },
  {
    key: "{issub}",
    label: "É inscrito",
    description: 'Retorna "inscrito" se for sub, vazio caso contrário.',
    usage: "{issub}",
    category: "user",
    example: "inscrito",
  },
  {
    key: "{isvip}",
    label: "É VIP",
    description: 'Retorna "vip" se for VIP, vazio caso contrário.',
    usage: "{isvip}",
    category: "user",
    example: "vip",
  },
];

export const BOT_POINTS_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{points}",
    label: "Pontos do viewer",
    description: "Saldo de pontos de quem usou o comando.",
    usage: "Você tem {points} pontos",
    category: "points",
    example: "1250",
  },
  {
    key: "{totalPoints}",
    label: "Saldo total de pontos",
    description: "Saldo após o comando (alias de {points} em recompensas).",
    usage: "Saldo: {totalPoints} pontos",
    category: "points",
    example: "1300",
  },
  {
    key: "{pointsAdded}",
    label: "Pontos alterados",
    description:
      "Quantidade concedida ou removida neste uso (efeito de pontos do comando). Positivo = ganhou; negativo = perdeu.",
    usage: "Você ganhou {pointsAdded} pontos!",
    category: "points",
    example: "50",
  },
  {
    key: "{rank}",
    label: "Posição no ranking",
    description: "Posição no ranking de pontos do canal.",
    usage: "Você está em #{rank}",
    category: "points",
    example: "3",
  },
  {
    key: "{level}",
    label: "Nível de XP",
    description: "Nível numérico do viewer no sistema de XP.",
    usage: "Nível {level}",
    category: "points",
    example: "12",
  },
  {
    key: "{levelTitle}",
    label: "Título do nível",
    description: "Nome do nível configurado (ex.: Regular, VIP).",
    usage: "Rank: {levelTitle}",
    category: "points",
    example: "Regular",
  },
];

export const BOT_COOLDOWN_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{cooldownRemaining}",
    label: "Tempo restante (este comando)",
    description:
      "Tempo formatado até o comando atual sair de cooldown (ex.: 45 segundos, 2 minutos). Use na mensagem de cooldown.",
    usage: "Aguarde {cooldownRemaining} para usar de novo.",
    category: "cooldown",
    example: "2 minutos",
  },
  {
    key: "{cooldownSeconds}",
    label: "Segundos restantes (este comando)",
    description: "Segundos inteiros até o fim do cooldown do comando atual.",
    usage: "Faltam {cooldownSeconds}s",
    category: "cooldown",
    example: "45",
  },
  {
    key: "{cooldownRemaining:!daily}",
    label: "Cooldown de outro comando",
    description:
      "Tempo restante do cooldown de outro trigger (global ou por viewer). Troque !daily pelo comando desejado.",
    usage: "!daily libera em {cooldownRemaining:!daily}",
    category: "cooldown",
    example: "5 minutos",
  },
  {
    key: "{cooldownSeconds:!daily}",
    label: "Segundos de outro comando",
    description: "Segundos restantes do cooldown de outro trigger.",
    usage: "{if:{cooldownSeconds:!daily}|Aguarde|Liberado!}",
    category: "cooldown",
    example: "300",
  },
];

export const BOT_RANDOM_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{random}",
    label: "Número aleatório 1–100",
    description: "Sorteia um número entre 1 e 100.",
    usage: "Sorteio: {random}",
    category: "random",
    example: "42",
  },
  {
    key: "{random:1-6}",
    label: "Número aleatório customizado",
    description: "Sorteia entre N e M. Ex.: {random:1-6} para um dado.",
    usage: "Dado: {random:1-6}",
    category: "random",
    example: "4",
  },
  {
    key: "{pick:a|b|c}",
    label: "Escolha aleatória",
    description: "Escolhe uma opção separada por |.",
    usage: "Emote: {pick:PogChamp|KEKW|Sadge}",
    category: "random",
    example: "KEKW",
  },
];

export const BOT_DATETIME_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{date}",
    label: "Data atual",
    description: "Data no fuso do streamer.",
    usage: "Hoje é {date}",
    category: "datetime",
    example: "08/06/2026",
  },
  {
    key: "{time}",
    label: "Hora atual",
    description: "Hora no fuso do streamer.",
    usage: "Agora são {time}",
    category: "datetime",
    example: "21:45",
  },
  {
    key: "{year}",
    label: "Ano atual",
    description: "Ano corrente.",
    usage: "Copyright {year}",
    category: "datetime",
    example: "2026",
  },
];

export const BOT_USAGE_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{uses}",
    label: "Usos na stream",
    description: "Quantas vezes o comando foi usado na stream atual.",
    usage: "Usado {uses} vezes nesta live",
    category: "usage",
    example: "5",
  },
  {
    key: "{totaluses}",
    label: "Usos totais",
    description: "Total histórico de usos do comando.",
    usage: "Total: {totaluses} usos",
    category: "usage",
    example: "128",
  },
  {
    key: "{lastuser}",
    label: "Último usuário",
    description: "Login do último viewer que usou o comando nesta stream.",
    usage: "Antes de você: {lastuser}",
    category: "usage",
    example: "fantonlord",
  },
];

export const BOT_TEXT_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{upper:{args}}",
    label: "MAIÚSCULAS",
    description: "Converte o argumento para maiúsculas.",
    usage: "Grito: {upper:{1}}",
    category: "text",
    example: "OI",
  },
  {
    key: "{lower:{args}}",
    label: "minúsculas",
    description: "Converte o argumento para minúsculas.",
    usage: "Sussurro: {lower:{1}}",
    category: "text",
    example: "oi",
  },
  {
    key: "{length:{args}}",
    label: "Comprimento",
    description: "Quantidade de caracteres do argumento.",
    usage: "Tamanho: {length:{1}}",
    category: "text",
    example: "5",
  },
  {
    key: "{trim:{args}}",
    label: "Trim",
    description: "Remove espaços extras do argumento.",
    usage: "{trim:{args}}",
    category: "text",
    example: "texto limpo",
  },
];

export const BOT_MATH_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{calc:10*3}",
    label: "Cálculo simples",
    description: "Operação aritmética (+, -, *, /) com até 4 operandos.",
    usage: "Resultado: {calc:10*3}",
    category: "math",
    example: "30",
  },
];

export const BOT_CONDITIONAL_VARIABLES: BotVariableDefinition[] = [
  {
    key: "{if:{1}|{1}|mundo}",
    label: "Condicional",
    description:
      "Retorna o segundo valor se o argumento existir, senão o terceiro.",
    usage: "Olá {if:{1}|{1}|mundo}!",
    category: "conditional",
    example: "Olá fantonlord!",
  },
];

/** Todas as variáveis expansíveis para autocomplete e referência. */
export const BOT_EXPANDED_VARIABLE_GROUPS: Record<string, BotVariableDefinition[]> = {
  live: BOT_LIVE_VARIABLES,
  user: BOT_USER_INFO_VARIABLES,
  points: BOT_POINTS_VARIABLES,
  cooldown: BOT_COOLDOWN_VARIABLES,
  random: BOT_RANDOM_VARIABLES,
  datetime: BOT_DATETIME_VARIABLES,
  usage: BOT_USAGE_VARIABLES,
  text: BOT_TEXT_VARIABLES,
  math: BOT_MATH_VARIABLES,
  conditional: BOT_CONDITIONAL_VARIABLES,
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
    key: "{points}",
    label: "Quantidade de pontos",
    description: "Valor numérico de pontos (saldo ou quantidade informada).",
    usage: "Você tem {points} pontos.",
    category: "meta",
  },
  {
    key: "{pointsAdded}",
    label: "Pontos alterados",
    description:
      "Quantidade concedida ou removida neste uso (efeito de pontos configurável).",
    usage: "Você ganhou {pointsAdded} pontos!",
    category: "meta",
  },
  {
    key: "{pointsRemoved}",
    label: "Pontos removidos",
    description: "Quantidade removida no !removepontos.",
    usage: "-{pointsRemoved} pontos.",
    category: "meta",
  },
  {
    key: "{totalPoints}",
    label: "Saldo total de pontos",
    description: "Saldo do viewer no canal após o comando.",
    usage: "Saldo: {totalPoints} pontos.",
    category: "meta",
  },
  {
    key: "{levelTitle}",
    label: "Título do nível",
    description: "Nome do nível do viewer (sistema de XP).",
    usage: "Seu rank: {levelTitle}",
    category: "meta",
  },
  {
    key: "{firstResult}",
    label: "Resultado do !first",
    description: 'won = foi o primeiro do dia; already_taken = alguém já abriu.',
    usage: "Usado em regras condicionais de pontos.",
    category: "meta",
    example: "won",
  },
  {
    key: "{jokenpoResult}",
    label: "Resultado jokenpo (máquina)",
    description: "win, lose ou draw — para regras de pontos condicionais.",
    usage: "Regra: jokenpoResult = win → +10 pts",
    category: "meta",
    example: "win",
  },
  {
    key: "{coinSide}",
    label: "Lado da moeda",
    description: "Resultado sorteado no !moeda: cara ou coroa.",
    usage: "Deu {coinSide}!",
    category: "meta",
    example: "cara",
  },
  {
    key: "{coinResult}",
    label: "Resultado moeda (win/lose)",
    description: "win ou lose — para regras de pontos no !moeda.",
    usage: "Regra condicional de pontos.",
    category: "meta",
    example: "win",
  },
  {
    key: "{cooldownRemaining}",
    label: "Cooldown restante",
    description: "Tempo formatado até o comando sair de cooldown.",
    usage: "Aguarde {cooldownRemaining}.",
    category: "meta",
  },
  {
    key: "{cooldownSeconds}",
    label: "Segundos de cooldown",
    description: "Segundos inteiros restantes de cooldown.",
    usage: "Faltam {cooldownSeconds}s",
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
    label: "Resultado moeda (win/lose)",
    description: "win ou lose — use em regras de pontos. Para cara/coroa sorteado, use {coinSide}.",
    usage: "{coinResult}",
    category: "meta",
    example: "win",
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
    key: "{jokenpoResult}",
    label: "Resultado jokenpo (máquina)",
    description: "win, lose ou draw — para regras condicionais de pontos.",
    usage: "{jokenpoResult}",
    category: "meta",
    example: "win",
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
