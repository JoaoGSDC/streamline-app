import type { BotVariableDefinition } from "@server/bot/bot-variables.catalog";

/** Máximo de placeholders numerados {1}…{N} (compatível com StreamElements). */
export const BOT_COMMAND_ARG_SLOT_COUNT = 9;

/**
 * Variáveis preenchidas pelo bot a partir do texto digitado após o trigger.
 * Ex.: `!hugs @joaomossi7` → `{1}` = `@joaomossi7`
 */
export function buildCommandArgVariableDefinitions(): BotVariableDefinition[] {
  const numbered: BotVariableDefinition[] = Array.from(
    { length: BOT_COMMAND_ARG_SLOT_COUNT },
    (_, index) => {
      const n = index + 1;
      return {
        key: `{${n}}`,
        label: `${n}º argumento`,
        description:
          n === 1
            ? "Primeiro token após o comando. Ex.: !hugs @joaomossi7 → @joaomossi7"
            : `Token na posição ${n} após o comando (separados por espaço).`,
        usage:
          n === 1
            ? "{displayName} meteu Hugs em {1}"
            : `{user} escolheu {1} e {${n}}`,
        category: "args" as const,
        example:
          n === 1 ? "!hugs @joaomossi7 → @joaomossi7" : undefined,
      };
    }
  );

  return [
    ...numbered,
    {
      key: "{args}",
      label: "Todos os argumentos",
      description:
        "Tudo que veio depois do comando, unido por espaço (equivalente a juntar {1} {2} …).",
      usage: "Comando recebido: {args}",
      category: "args",
      example: "!duelo @fulano 100 → @fulano 100",
    },
    {
      key: "{argcount}",
      label: "Quantidade de argumentos",
      description: "Número de tokens após o comando.",
      usage: "Você passou {argcount} argumento(s).",
      category: "args",
      example: "2",
    },
    {
      key: "{target}",
      label: "Alvo (1º argumento)",
      description:
        "Atalho para {1} — comum em comandos com @usuario ou nome de canal.",
      usage: "{displayName} desafiou {target}!",
      category: "args",
      example: "@joaomossi7",
    },
  ];
}

export const BOT_COMMAND_ARG_VARIABLES = buildCommandArgVariableDefinitions();

/** Tokens após o trigger (espaços; mantém @ e pontuação do chat). */
export function tokenizeCommandArgs(rawArgs: string): string[] {
  const trimmed = rawArgs.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

/**
 * Extrai argumentos de uma mensagem IRC/chat.
 * @param message Corpo completo, ex.: "!hugs @joaomossi7"
 * @param trigger Trigger normalizado, ex.: "!hugs"
 */
export function parseCommandArgsFromMessage(
  message: string,
  trigger: string
): string[] {
  const normalizedTrigger = trigger.trim().toLowerCase();
  const lowerMessage = message.trim().toLowerCase();
  const triggerIndex = lowerMessage.indexOf(normalizedTrigger);
  if (triggerIndex === -1) return [];

  const afterTrigger = message
    .slice(triggerIndex + normalizedTrigger.length)
    .trim();
  return tokenizeCommandArgs(afterTrigger);
}

/** Mapa `{1}`…`{9}`, `{args}`, `{argcount}`, `{target}` para substituição. */
export function buildCommandArgSubstitutionMap(
  args: string[]
): Record<string, string> {
  const map: Record<string, string> = {
    args: args.join(" "),
    argcount: String(args.length),
    target: args[0] ?? "",
  };

  for (let index = 0; index < BOT_COMMAND_ARG_SLOT_COUNT; index += 1) {
    map[String(index + 1)] = args[index] ?? "";
  }

  return map;
}

/** Substitui `{chave}` e `{count:nome}` em templates de mensagem. */
export function substituteMessageVariables(
  template: string,
  values: Record<string, string>
): string {
  let result = template.replace(/\{count:([^}]+)\}/g, (_, name: string) => {
    const key = `count:${name.trim()}`;
    return values[key] ?? values[name.trim()] ?? `{count:${name}}`;
  });

  result = result.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in values && values[key] !== "") return values[key];
    if (key in values && values[key] === "") return "";
    return match;
  });

  return result.replace(/\s{2,}/g, " ").trim();
}

/** Equivalência StreamElements: ${sender} → {displayName} / {sender} */
export const STREAM_ELEMENTS_VARIABLE_ALIASES: Record<string, string> = {
  sender: "displayName",
  user: "user",
  channel: "channel",
};

/** Converte template StreamElements (${1}, ${sender}) para formato StreaminHub. */
export function migrateStreamElementsTemplate(template: string): string {
  return template
    .replace(/\$\{sender\}/gi, "{displayName}")
    .replace(/\$\{(\d+)\}/g, "{$1}")
    .replace(/\$\{user\}/gi, "{user}")
    .replace(/\$\{channel\}/gi, "{channel}");
}
