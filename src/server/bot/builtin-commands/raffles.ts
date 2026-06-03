import { raffleRuntime } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const RAFFLES_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  raffleRuntime("sorteio", "!sorteio", {
    description: "Participa do sorteio ativo no canal.",
    defaultCooldownSeconds: 10,
    responseTemplate:
      "Feito, {displayName}! Você entrou no sorteio. Boa sorte 🍀",
    runtimeNotes: "Registrar entrada no sorteio em andamento; validar se há sorteio aberto.",
  }),
  raffleRuntime("duelo", "!duelo", {
    description: "Inicia duelo de pontos contra outro usuário.",
    argsHint: "@usuario",
    defaultCooldownSeconds: 30,
    responseTemplate:
      "{displayName} desafiou {targetUser} — {dueloResult}",
    runtimeNotes: "Debitar/apostar pontos dos dois participantes.",
  }),
  raffleRuntime("moeda", "!moeda", {
    description: "Cara ou coroa com escolha do usuário.",
    argsHint: "cara | coroa",
    defaultCooldownSeconds: 15,
    responseTemplate:
      "{displayName}, você escolheu {userChoice}. Deu {coinResult}! {coinOutcome}",
    runtimeNotes: "Validar argumento cara/coroa; {coinOutcome} = ganhou/perdeu de forma amigável.",
  }),
  raffleRuntime("roleta", "!roleta", {
    description: "Aposta pontos na roleta do canal.",
    defaultCooldownSeconds: 30,
    responseTemplate: "{displayName}, a roleta parou em {rouletteResult}. {rouletteOutcome}",
    runtimeNotes: "Integrar com economia de pontos do bot.",
  }),
  raffleRuntime("jokenpo", "!jokenpo", {
    description: "Pedra, papel ou tesoura contra o bot.",
    argsHint: "pedra | papel | tesoura",
    defaultCooldownSeconds: 15,
    responseTemplate:
      "Você: {userChoice} · Bot: {botChoice}. {jokenpoOutcome}",
  }),
  raffleRuntime("dado", "!dado", {
    description: "Rola um dado D6.",
    defaultCooldownSeconds: 10,
    responseTemplate: "{displayName} rolou o dado… caiu {diceResult}! 🎲",
  }),
];
