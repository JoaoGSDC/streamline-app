import { generalRuntime, modRuntime } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const QUOTES_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  generalRuntime("quote", "!quote", {
    description: "Exibe uma quote aleatória, por número, categoria, tag ou jogo.",
    defaultCooldownSeconds: 15,
    argsHint: "[número | categoria | tag | jogo]",
    responseTemplate:
      'Quote #{quoteNumber}: "{quoteText}" — {quoteSpeaker}{quoteGame}',
    runtimeNotes:
      "Sem argumentos: aleatória. Número: quote específica. Texto: busca por categoria, tag ou jogo.",
  }),
  modRuntime("addquote", "!addquote", {
    description: "Adiciona uma nova quote ao canal.",
    defaultCooldownSeconds: 10,
    argsHint: "<texto da quote>",
    responseTemplate: 'Quote #{quoteNumber} registrada: "{quoteText}"',
    runtimeNotes: "Somente moderadores. Captura contexto da live quando disponível.",
  }),
];
