import { streamerAction } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const STREAMER_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  streamerAction("raid", "!raid", {
    description: "Inicia raid para outro canal.",
    argsHint: "[canal]",
  }),
  streamerAction("unraid", "!unraid", {
    description: "Cancela raid pendente.",
  }),
  streamerAction("marker", "!marker", {
    description: "Cria marcador na transmissão (VOD).",
  }),
  streamerAction("ad", "!ad", {
    description: "Inicia anúncio na live.",
    argsHint: "[segundos]",
  }),
  streamerAction("live", "!live", {
    description: "Dispara anúncio de live em integrações conectadas.",
    runtimeNotes: "Webhook/discord/twitter conforme integrações do streamer.",
  }),
];
