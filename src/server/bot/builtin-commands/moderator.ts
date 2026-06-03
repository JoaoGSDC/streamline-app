import { modAction } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const MODERATOR_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  modAction("setjogo", "!setjogo", {
    description: "Altera o jogo/categoria da live.",
    argsHint: "[nome do jogo]",
    responseTemplate: "Pronto! Categoria atualizada para {game}.",
    confirmationPrompt:
      "@{displayName}, alterar a categoria da live para \"{argsSummary}\"? Responda sim ou não.",
  }),
  modAction("settitulo", "!settitulo", {
    description: "Altera o título da transmissão.",
    argsHint: "[título]",
    responseTemplate: "Título da live atualizado.",
    confirmationPrompt:
      "@{displayName}, mudar o título da live para \"{argsSummary}\"? Responda sim ou não.",
  }),
  modAction("timeout", "!timeout", {
    description: "Aplica timeout em um usuário.",
    argsHint: "[segundos] @usuario",
    responseTemplate:
      "{targetUser} levou timeout de {duration}s. Motivo: moderação do canal.",
    confirmationPrompt:
      "@{displayName}, aplicar timeout de {argsSummary}? Responda sim ou não.",
  }),
  modAction("ban", "!ban", {
    description: "Bane um usuário do chat.",
    argsHint: "@usuario",
    responseTemplate: "{targetUser} foi banido do chat.",
    confirmationPrompt:
      "@{displayName}, banir {argsSummary} do chat? Responda sim ou não.",
  }),
  modAction("unban", "!unban", {
    description: "Remove ban de um usuário.",
    argsHint: "@usuario",
    responseTemplate: "Ban removido para {targetUser}.",
    confirmationPrompt:
      "@{displayName}, remover o ban de {argsSummary}? Responda sim ou não.",
  }),
  modAction("permit", "!permit", {
    description: "Libera envio de links temporariamente para um usuário.",
    argsHint: "@usuario",
    responseTemplate: "{targetUser} pode enviar links por enquanto.",
    confirmationPrompt:
      "@{displayName}, liberar links para {argsSummary}? Responda sim ou não.",
  }),
  modAction("slow", "!slow", {
    description: "Ativa slow mode no chat.",
    argsHint: "[segundos]",
    responseTemplate: "Slow mode ativado ({duration}s entre mensagens).",
    confirmationPrompt:
      "@{displayName}, ativar slow mode de {argsSummary}? Responda sim ou não.",
  }),
  modAction("slowoff", "!slowoff", {
    description: "Desativa slow mode no chat.",
    responseTemplate: "Slow mode desligado — chat liberado.",
    confirmationPrompt:
      "@{displayName}, desativar o slow mode? Responda sim ou não.",
  }),
  modAction("followers", "!followers", {
    description: "Ativa modo somente seguidores.",
    argsHint: "[tempo: 0m, 10m, 30m, 1h, …]",
    responseTemplate: "Chat no modo seguidores ({duration}).",
    confirmationPrompt:
      "@{displayName}, ativar followers-only ({argsSummary})? Responda sim ou não.",
  }),
  modAction("followersoff", "!followersoff", {
    description: "Desativa modo somente seguidores.",
    responseTemplate: "Modo seguidores desativado.",
    confirmationPrompt:
      "@{displayName}, desativar followers-only? Responda sim ou não.",
  }),
  modAction("subonly", "!subonly", {
    description: "Ativa modo somente inscritos.",
    responseTemplate: "Chat só para inscritos agora.",
    confirmationPrompt:
      "@{displayName}, ativar sub-only? Responda sim ou não.",
  }),
  modAction("subonlyoff", "!subonlyoff", {
    description: "Desativa modo somente inscritos.",
    responseTemplate: "Sub-only desativado.",
    confirmationPrompt:
      "@{displayName}, desativar sub-only? Responda sim ou não.",
  }),
  modAction("emoteonly", "!emoteonly", {
    description: "Ativa modo somente emotes.",
    responseTemplate: "Chat em modo emote-only.",
    confirmationPrompt:
      "@{displayName}, ativar emote-only? Responda sim ou não.",
  }),
  modAction("emoteonlyoff", "!emoteonlyoff", {
    description: "Desativa modo somente emotes.",
    responseTemplate: "Emote-only desativado.",
    confirmationPrompt:
      "@{displayName}, desativar emote-only? Responda sim ou não.",
  }),
  modAction("clear", "!clear", {
    description: "Limpa o chat do canal.",
    responseTemplate: "Chat limpo.",
    confirmationPrompt:
      "@{displayName}, limpar todo o chat? Responda sim ou não.",
  }),
  modAction("poll", "!poll", {
    description: "Gerencia enquetes da Twitch (criar ou encerrar).",
    argsHint: "criar | encerrar",
    responseTemplate: "{pollResult}",
    confirmationPrompt:
      "@{displayName}, executar enquete ({argsSummary})? Responda sim ou não.",
    runtimeNotes: "Subcomandos: !poll criar … e !poll encerrar via Helix.",
  }),
  modAction("prediction", "!prediction", {
    description: "Gerencia previsões da Twitch (criar ou encerrar).",
    argsHint: "criar | encerrar",
    responseTemplate: "{predictionResult}",
    confirmationPrompt:
      "@{displayName}, executar previsão ({argsSummary})? Responda sim ou não.",
    runtimeNotes: "Subcomandos: !prediction criar … e !prediction encerrar via Helix.",
  }),
];
