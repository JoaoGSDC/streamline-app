import { modAction } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const MODERATOR_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  modAction("setjogo", "!setjogo", {
    description: "Altera o jogo/categoria da live.",
    argsHint: "[nome do jogo]",
  }),
  modAction("settitulo", "!settitulo", {
    description: "Altera o título da transmissão.",
    argsHint: "[título]",
  }),
  modAction("timeout", "!timeout", {
    description: "Aplica timeout em um usuário.",
    argsHint: "[segundos] @usuario",
  }),
  modAction("ban", "!ban", {
    description: "Bane um usuário do chat.",
    argsHint: "@usuario",
  }),
  modAction("unban", "!unban", {
    description: "Remove ban de um usuário.",
    argsHint: "@usuario",
  }),
  modAction("permit", "!permit", {
    description: "Libera envio de links temporariamente para um usuário.",
    argsHint: "@usuario",
  }),
  modAction("slow", "!slow", {
    description: "Ativa slow mode no chat.",
    argsHint: "[segundos]",
  }),
  modAction("slowoff", "!slowoff", {
    description: "Desativa slow mode no chat.",
  }),
  modAction("followers", "!followers", {
    description: "Ativa modo somente seguidores.",
    argsHint: "[tempo: 0m, 10m, 30m, 1h, …]",
  }),
  modAction("followersoff", "!followersoff", {
    description: "Desativa modo somente seguidores.",
  }),
  modAction("subonly", "!subonly", {
    description: "Ativa modo somente inscritos.",
  }),
  modAction("subonlyoff", "!subonlyoff", {
    description: "Desativa modo somente inscritos.",
  }),
  modAction("emoteonly", "!emoteonly", {
    description: "Ativa modo somente emotes.",
  }),
  modAction("emoteonlyoff", "!emoteonlyoff", {
    description: "Desativa modo somente emotes.",
  }),
  modAction("clear", "!clear", {
    description: "Limpa o chat do canal.",
  }),
  modAction("poll", "!poll", {
    description: "Gerencia enquetes da Twitch (criar ou encerrar).",
    argsHint: "criar | encerrar",
    runtimeNotes: "Subcomandos: !poll criar … e !poll encerrar via Helix.",
  }),
  modAction("prediction", "!prediction", {
    description: "Gerencia previsões da Twitch (criar ou encerrar).",
    argsHint: "criar | encerrar",
    runtimeNotes: "Subcomandos: !prediction criar … e !prediction encerrar via Helix.",
  }),
];
