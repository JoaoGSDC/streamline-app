import type {
  BotVariableItem,
  BotVariablesCatalogResponse,
} from "@services/entities/bot-variables.services";

export function flattenCatalogVariables(
  catalog: BotVariablesCatalogResponse | null
): BotVariableItem[] {
  if (!catalog) return [];

  const expanded = catalog.expandedGroups
    ? Object.values(catalog.expandedGroups).flat()
    : [];

  return [
    ...catalog.globals,
    ...(catalog.commandArgs ?? []),
    ...catalog.counters,
    ...catalog.timers,
    ...expanded,
  ];
}

export const AUTOCOMPLETE_CATEGORY_LABELS: Record<string, string> = {
  global: "Globais",
  args: "Argumentos",
  counter: "Contadores",
  timer: "Timers",
  meta: "Runtime",
  live: "Live",
  user: "Usuário",
  points: "Pontuação",
  random: "Randomização",
  datetime: "Data e hora",
  usage: "Uso do comando",
  text: "Texto",
  math: "Matemática",
  conditional: "Condicional",
};
