import { getFyrewireClipApiUrlTemplate } from "@server/bot/fyrewire-clip";
import { generalRuntime, generalStatic } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const GENERAL_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  generalRuntime("comandos", "!comandos", {
    description: "Lista todos os comandos disponíveis no canal.",
    defaultCooldownSeconds: 60,
    responseTemplate:
      "Comandos do canal: {commandList} — digite um deles para saber mais!",
    runtimeNotes:
      "Substituir {commandList} por lista curta de triggers ativos (padrão + personalizados).",
  }),
  generalStatic(
    "social",
    "!social",
    "Quer me achar fora da Twitch? Tá tudo reunido aqui 👉 https://streaminhub.com/{channel}/links",
    {
      description: "Exibe o link da Link Page (/links) do perfil na plataforma.",
      defaultCooldownSeconds: 30,
    }
  ),
  generalStatic(
    "agenda",
    "!agenda",
    "Próximas lives e perfil completo: https://streaminhub.com/{channel}",
    {
      description: "Exibe o link do perfil público na plataforma.",
      defaultCooldownSeconds: 30,
    }
  ),
  generalStatic(
    "jogos",
    "!jogos",
    "Jogos que estou jogando ou já joguei: https://streaminhub.com/{channel}/games",
    {
      description: "Exibe o link da listagem de jogos (/games) do perfil.",
      defaultCooldownSeconds: 30,
    }
  ),
  generalRuntime("followage", "!followage", {
    description: "Tempo que o usuário segue o canal.",
    defaultCooldownSeconds: 20,
    responseTemplate:
      "{displayName}, você segue {channel} há {followage}. Obrigado por estar por aqui 💜",
  }),
  generalRuntime("uptime", "!uptime", {
    description: "Tempo desde o início da live atual.",
    defaultCooldownSeconds: 20,
    responseTemplate:
      "A live do {channel} está no ar há {uptime}. Bora mais um pouco!",
  }),
  generalRuntime("game", "!game", {
    description: "Jogo/categoria atual da live e tempo jogando.",
    defaultCooldownSeconds: 20,
    responseTemplate:
      "Agora estamos em {game} — já faz {gameDuration} nessa categoria.",
  }),
  generalRuntime("vanish", "!vanish", {
    description: "Apaga mensagens anteriores do próprio usuário no chat.",
    defaultCooldownSeconds: 30,
    responseTemplate: "Pronto, {displayName} — sumi com suas mensagens anteriores.",
    runtimeNotes: "Requer permissões de moderação para o bot ou integração IRC.",
  }),
  generalRuntime("title", "!title", {
    description: "Exibe o título atual da transmissão.",
    defaultCooldownSeconds: 20,
    responseTemplate: "Título da live: {title}",
  }),
  generalRuntime("viewers", "!viewers", {
    description: "Quantidade atual de espectadores na live.",
    defaultCooldownSeconds: 15,
    responseTemplate:
      "Temos {viewers} pessoas assistindo agora. Valeu demais por estar aqui!",
  }),
  generalRuntime("accountage", "!accountage", {
    description: "Há quanto tempo a conta Twitch do usuário existe.",
    defaultCooldownSeconds: 20,
    responseTemplate:
      "{displayName}, sua conta existe há {accountage}.",
  }),
  generalRuntime("first", "!first", {
    description: "Mostra quem foi o primeiro a falar no chat naquele dia.",
    defaultCooldownSeconds: 30,
    responseTemplate:
      "Hoje quem abriu o chat foi {firstChatter}.",
    runtimeNotes: "Estado diário por canal; resetar à meia-noite no fuso do streamer.",
  }),
  generalRuntime("lurk", "!lurk", {
    description: "Marca o usuário como ausente (lurking).",
    defaultCooldownSeconds: 60,
    responseTemplate:
      "Beleza, {displayName}! Curtindo no lurk? Quando quiser voltar, é só falar no chat 💤",
  }),
  generalRuntime("unlurk", "!unlurk", {
    description: "Remove o status de ausente do usuário.",
    defaultCooldownSeconds: 30,
    responseTemplate: "Bem-vindo de volta, {displayName}! Que bom te ver por aqui de novo.",
  }),
  generalRuntime("watchtime", "!watchtime", {
    description: "Tempo total assistindo ao canal.",
    defaultCooldownSeconds: 20,
    responseTemplate:
      "{displayName}, você já passou {watchtime} acompanhando o {channel}.",
    runtimeNotes: "Depende de contador/pontos persistidos pelo bot.",
  }),
  generalRuntime("daily", "!daily", {
    description:
      "Recompensa da live — 300 pontos, uma vez por usuário enquanto a transmissão estiver no ar.",
    defaultCooldownSeconds: 10,
    customizableResponse: true,
    defaultResponse:
      "{displayName} coletou sua recompensa diária de {pointsAdded} pontos! Agora você tem {points} pontos.",
    responseTemplate:
      "{displayName} coletou sua recompensa diária de {pointsAdded} pontos! Agora você tem {points} pontos.",
    runtimeNotes:
      "POST .../live-rewards/claim com rewardKey=daily e streamStartedAt (started_at da stream Twitch). " +
      "Uma vez por usuário por transmissão. Se status=already_claimed, responder algo como: " +
      "\"{displayName}, você já coletou !daily nesta live.\"",
    economyRewardKey: "daily",
    economyRewardPoints: 300,
  }),
  generalRuntime("early", "!early", {
    description:
      "Bônus por chegar cedo na live — 100 pontos, uma vez por usuário por transmissão.",
    defaultCooldownSeconds: 10,
    customizableResponse: true,
    defaultResponse:
      "{displayName} chegou cedo e ganhou {pointsAdded} pontos! Agora você tem {points} pontos.",
    responseTemplate:
      "{displayName} chegou cedo e ganhou {pointsAdded} pontos! Agora você tem {points} pontos.",
    runtimeNotes:
      "POST .../live-rewards/claim com rewardKey=early e streamStartedAt. " +
      "Uma vez por usuário por transmissão. Se status=already_claimed: " +
      "\"{displayName}, você já usou !early nesta live.\"",
    economyRewardKey: "early",
    economyRewardPoints: 100,
  }),
  generalRuntime("pontos", "!pontos", {
    description: "Mostra quantos pontos o usuário tem no canal.",
    defaultCooldownSeconds: 10,
    customizableResponse: true,
    defaultResponse: "{displayName}, você tem {points} pontos.",
    responseTemplate: "{displayName}, você tem {points} pontos.",
    runtimeNotes:
      "GET .../balance/{twitchUserId}. Substituir {points} pelo saldo retornado (0 se viewer novo).",
    economyBalanceCommand: true,
  }),
  generalRuntime("rank", "!rank", {
    description: "Posição do usuário no ranking de watchtime do canal.",
    defaultCooldownSeconds: 20,
    responseTemplate:
      "{displayName}, você está em #{rank} no ranking de presença do canal.",
    runtimeNotes: "Depende de contador/pontos persistidos pelo bot.",
  }),
  generalStatic(
    "pix",
    "!pix",
    "Quer apoiar o {channel}? Edite esta mensagem na admin com sua chave PIX ou link — ou digite aqui o texto que quiser mostrar.",
    {
      description: "Exibe chave PIX ou link de apoio configurável pelo streamer.",
      defaultCooldownSeconds: 60,
    }
  ),
  generalRuntime("clip", "!clip", {
    description:
      "Gera um clipe da live via FyreWire (requer canal online).",
    defaultCooldownSeconds: 60,
    argsHint: "(sem argumentos)",
    externalApiUrlTemplate: getFyrewireClipApiUrlTemplate(),
    responseTemplate:
      "{displayName}, clip criado! {clipResponse}",
    runtimeNotes:
      "GET em externalApiUrlTemplate com {channel}; usar corpo da API em {clipResponse}. " +
      "Se a API falhar, responder com mensagem amigável (ex.: canal offline).",
  }),
];
