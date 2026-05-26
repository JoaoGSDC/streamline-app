import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface BotVariableItem {
  key: string;
  label: string;
  description: string;
  usage: string;
  category: "global" | "counter" | "timer" | "meta";
  example?: string;
}

export interface BotVariablesCatalogResponse {
  categories: Record<string, string>;
  globals: BotVariableItem[];
  counters: BotVariableItem[];
  timers: BotVariableItem[];
  builtinCommands: { trigger: string; description: string }[];
}

export const botVariables = {
  getCatalog: async (): Promise<BotVariablesCatalogResponse> => {
    const response = await httpClient.get<BotVariablesCatalogResponse>(
      ENDPOINTS.Internal.Bot.Variables
    );
    return (
      response.data ?? {
        categories: {},
        globals: [],
        counters: [],
        timers: [],
        builtinCommands: [],
      }
    );
  },
};
