import { getFyrewireClipApiUrlTemplate } from "@server/bot/fyrewire-clip";
import { generalRuntime, generalStatic } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const GENERAL_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  generalRuntime("comandos", "!comandos", {
    description: "Lista todos os comandos disponíveis no canal.",
    defaultCooldownSeconds: 60,
    runtimeNotes:
      "Montar lista dinâmica com comandos padrão ativos + personalizados do streamer.",
  }),
  generalStatic(
    "social",
    "!social",
    "Redes e links do {channel}: https://streaminhub.com/{channel}/links",
    {
      description: "Exibe o link da Link Page (/links) do perfil na plataforma.",
      defaultCooldownSeconds: 30,
    }
  ),
  generalStatic(
    "agenda",
    "!agenda",
    "Perfil e agenda de lives do {channel}: https://streaminhub.com/{channel}",
    {
      description: "Exibe o link do perfil público na plataforma.",
      defaultCooldownSeconds: 30,
    }
  ),
  generalStatic(
    "jogos",
    "!jogos",
    "Listagem de jogos do {channel}: https://streaminhub.com/{channel}/games",
    {
      description: 'Exibe o link da listagem de jogos (/games) do perfil.',
      defaultCooldownSeconds: 30,
    }
  ),
  generalRuntime("followage", "!followage", {
    description: "Tempo que o usuário segue o canal.",
    defaultCooldownSeconds: 20,
  }),
  generalRuntime("uptime", "!uptime", {
    description: "Tempo desde o início da live atual.",
    defaultCooldownSeconds: 20,
  }),
  generalRuntime("game", "!game", {
    description: "Jogo/categoria atual da live e tempo jogando.",
    defaultCooldownSeconds: 20,
  }),
  generalRuntime("vanish", "!vanish", {
    description: "Apaga mensagens anteriores do próprio usuário no chat.",
    defaultCooldownSeconds: 30,
    runtimeNotes: "Requer permissões de moderação para o bot ou integração IRC.",
  }),
  generalRuntime("title", "!title", {
    description: "Exibe o título atual da transmissão.",
    defaultCooldownSeconds: 20,
  }),
  generalRuntime("viewers", "!viewers", {
    description: "Quantidade atual de espectadores na live.",
    defaultCooldownSeconds: 15,
  }),
  generalRuntime("accountage", "!accountage", {
    description: "Há quanto tempo a conta Twitch do usuário existe.",
    defaultCooldownSeconds: 20,
  }),
  generalRuntime("first", "!first", {
    description: "Mostra quem foi o primeiro a falar no chat naquele dia.",
    defaultCooldownSeconds: 30,
    runtimeNotes: "Estado diário por canal; resetar à meia-noite no fuso do streamer.",
  }),
  generalRuntime("lurk", "!lurk", {
    description: "Marca o usuário como ausente (lurking).",
    defaultCooldownSeconds: 60,
  }),
  generalRuntime("unlurk", "!unlurk", {
    description: "Remove o status de ausente do usuário.",
    defaultCooldownSeconds: 30,
  }),
  generalRuntime("watchtime", "!watchtime", {
    description: "Tempo total assistindo ao canal.",
    defaultCooldownSeconds: 20,
    runtimeNotes: "Depende de contador/pontos persistidos pelo bot.",
  }),
  generalRuntime("rank", "!rank", {
    description: "Posição do usuário no ranking de watchtime do canal.",
    defaultCooldownSeconds: 20,
    runtimeNotes: "Depende de contador/pontos persistidos pelo bot.",
  }),
  generalStatic(
    "pix",
    "!pix",
    "Apoie o {channel}! Configure sua chave PIX ou link de apoio editando a mensagem deste comando.",
    {
      description: "Exibe chave PIX ou link de apoio configurável pelo streamer.",
      defaultCooldownSeconds: 60,
    }
  ),
  generalRuntime("clip", "!clip", {
    description:
      "Gera um clipe da live via FyreWire (requer canal online). A API recebe apenas o nome do canal.",
    defaultCooldownSeconds: 60,
    argsHint: "(sem argumentos)",
    externalApiUrlTemplate: getFyrewireClipApiUrlTemplate(),
    runtimeNotes:
      "FyreWire não recebe OAuth do viewer: o clip é criado com a conta StreaminHub " +
      "já autenticada no lado deles. O bot faz GET na URL de API substituindo {channel} " +
      "pelo login do canal e envia o texto retornado ao chat. " +
      `URL: ${getFyrewireClipApiUrlTemplate()}`,
  }),
];
