import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface BotVariableItem {
  key: string;
  label: string;
  description: string;
  usage: string;
  category: "global" | "args" | "counter" | "timer" | "meta";
  example?: string;
}

export type BotBuiltinCategoryId =
  | "general"
  | "raffles"
  | "moderator"
  | "streamer";

export interface BotBuiltinCommandCatalogItem {
  key: string;
  trigger: string;
  description: string;
  category: BotBuiltinCategoryId;
  minRole: "everyone" | "moderator" | "streamer";
  argsHint: string | null;
  executionKind: "static" | "runtime" | "mod_action" | "streamer_action";
  customizableResponse: boolean;
  runtimeNotes: string | null;
  externalApiUrlTemplate: string | null;
  responseTemplate: string | null;
  requiresConfirmation: boolean;
  confirmationPrompt: string | null;
  economyRewardKey: "daily" | "early" | null;
  economyRewardPoints: number | null;
  economyBalanceCommand: boolean;
}

export interface BotVariablesCatalogResponse {
  categories: Record<string, string>;
  globals: BotVariableItem[];
  commandArgs?: BotVariableItem[];
  counters: BotVariableItem[];
  timers: BotVariableItem[];
  runtimeTemplateVariables?: BotVariableItem[];
  confirmation?: {
    defaultPrompt: string;
    acceptWords: string[];
    rejectWords: string[];
    timeoutSeconds: number;
  };
  builtinCommandCategories?: Record<BotBuiltinCategoryId, string>;
  builtinCommands: BotBuiltinCommandCatalogItem[];
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
        commandArgs: [],
        counters: [],
        timers: [],
        builtinCommands: [],
      }
    );
  },
};
