import { raffleRuntime } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const RAFFLES_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  raffleRuntime("sorteio", "!sorteio", {
    description: "Participa do sorteio ativo no canal.",
    defaultCooldownSeconds: 10,
    runtimeNotes: "Registrar entrada no sorteio em andamento; validar se há sorteio aberto.",
  }),
  raffleRuntime("duelo", "!duelo", {
    description: "Inicia duelo de pontos contra outro usuário.",
    argsHint: "@usuario",
    defaultCooldownSeconds: 30,
    runtimeNotes: "Debitar/apostar pontos dos dois participantes.",
  }),
  raffleRuntime("moeda", "!moeda", {
    description:
      "Cara ou coroa: o usuário escolhe e o bot exibe o resultado e se ganhou ou perdeu.",
    argsHint: "cara | coroa",
    defaultCooldownSeconds: 15,
    runtimeNotes: "Validar argumento cara/coroa; opcionalmente apostar pontos.",
  }),
  raffleRuntime("roleta", "!roleta", {
    description: "Aposta pontos na roleta do canal.",
    defaultCooldownSeconds: 30,
    runtimeNotes: "Integrar com economia de pontos do bot.",
  }),
  raffleRuntime("jokenpo", "!jokenpo", {
    description: "Pedra, papel ou tesoura contra o bot.",
    argsHint: "pedra | papel | tesoura",
    defaultCooldownSeconds: 15,
  }),
  raffleRuntime("dado", "!dado", {
    description: "Rola um dado D6 e exibe o resultado.",
    defaultCooldownSeconds: 10,
  }),
];
