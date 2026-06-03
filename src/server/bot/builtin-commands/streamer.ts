import { streamerAction } from "./helpers";
import type { BotBuiltinCommandDefinition } from "./types";

export const STREAMER_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  streamerAction("raid", "!raid", {
    description: "Inicia raid para outro canal.",
    argsHint: "[canal]",
    responseTemplate: "Raid iniciada para {targetChannel}! Valeu a live, galera — bora lá 💜",
    confirmationPrompt:
      "@{displayName}, iniciar raid para {argsSummary}? Responda sim ou não.",
  }),
  streamerAction("unraid", "!unraid", {
    description: "Cancela raid pendente.",
    responseTemplate: "Raid cancelada.",
    confirmationPrompt:
      "@{displayName}, cancelar a raid pendente? Responda sim ou não.",
  }),
  streamerAction("marker", "!marker", {
    description: "Cria marcador na transmissão (VOD).",
    responseTemplate: "Marcador criado na transmissão.",
    confirmationPrompt:
      "@{displayName}, criar um marcador na live agora? Responda sim ou não.",
  }),
  streamerAction("ad", "!ad", {
    description: "Inicia anúncio na live.",
    argsHint: "[segundos]",
    responseTemplate: "Anúncio iniciado ({duration}s).",
    confirmationPrompt:
      "@{displayName}, rodar anúncio ({argsSummary})? Responda sim ou não.",
  }),
  streamerAction("live", "!live", {
    description: "Dispara anúncio de live em integrações conectadas.",
    responseTemplate: "Aviso de live enviado nas integrações.",
    confirmationPrompt:
      "@{displayName}, disparar aviso de live nas redes? Responda sim ou não.",
    runtimeNotes: "Webhook/discord/twitter conforme integrações do streamer.",
  }),
];
