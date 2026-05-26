export interface BotBuiltinCommandDefinition {
  key: string;
  trigger: string;
  defaultResponse: string;
  description: string;
  defaultCooldownSeconds: number;
}

export const BOT_BUILTIN_COMMANDS: BotBuiltinCommandDefinition[] = [
  {
    key: "discord",
    trigger: "!discord",
    defaultResponse:
      "Entre no nosso Discord! Link na bio do canal ou digite !redes 🎮",
    description: "Compartilha o convite do Discord do canal.",
    defaultCooldownSeconds: 30,
  },
  {
    key: "redes",
    trigger: "!redes",
    defaultResponse:
      "Siga {channel} nas redes! Confira a Link Page: streaminhub.com/{channel}",
    description: "Direciona para redes sociais e Link Page.",
    defaultCooldownSeconds: 30,
  },
  {
    key: "comandos",
    trigger: "!comandos",
    defaultResponse:
      "Comandos disponíveis: !discord · !redes · !horarios — e os personalizados do canal!",
    description: "Lista rápida dos comandos mais usados.",
    defaultCooldownSeconds: 60,
  },
  {
    key: "horarios",
    trigger: "!horarios",
    defaultResponse:
      "Agenda de lives em streaminhub.com/{channel} — confira os próximos horários!",
    description: "Link para a agenda pública de streams.",
    defaultCooldownSeconds: 60,
  },
  {
    key: "youtube",
    trigger: "!youtube",
    defaultResponse: "Inscreva-se no YouTube do {channel}! Link na bio 📺",
    description: "CTA para o YouTube do streamer.",
    defaultCooldownSeconds: 45,
  },
];

export function getBuiltinDefinition(
  key: string
): BotBuiltinCommandDefinition | undefined {
  return BOT_BUILTIN_COMMANDS.find((item) => item.key === key);
}
