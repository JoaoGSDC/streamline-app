import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  BotCommandAdvancedFields,
  BotCommandUsagePeriod,
  BotCommandUsageStatsDto,
} from "@server/bot/bot-command.types";

export interface BotCommandRecord extends BotCommandAdvancedFields {
  id: string;
  streamerId: string;
  trigger: string;
  response: string;
  cooldownSeconds: number;
  enabled: boolean;
  isBuiltin?: boolean;
  builtinKey?: string | null;
  pointsEffect?: import("@server/bot/command-points-effect").CommandPointsEffect | null;
  updatedAt: string | Date;
  createdAt?: string | Date;
  configVersion?: number;
}

export interface BotCommandsListResponse {
  items: BotCommandRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBotCommandPayload {
  trigger: string;
  response: string;
  cooldownSeconds?: number;
  enabled?: boolean;
  userCooldown?: number;
  minPermission?: BotCommandAdvancedFields["minPermission"];
  bypassCooldownFor?: BotCommandAdvancedFields["bypassCooldownFor"];
  maxUsesPerStream?: number;
  maxUsesPerUserPerStream?: number;
  seasonalLimitType?: BotCommandAdvancedFields["seasonalLimitType"];
  seasonalLimitAmount?: number;
  seasonalLimitDays?: number;
  requiresConfirmation?: boolean;
  isActionResponse?: boolean;
  isCaseSensitive?: boolean;
  aliases?: string[];
  argValidationType?: BotCommandAdvancedFields["argValidationType"];
  argRegexPattern?: string | null;
  argValidationError?: string | null;
  responseType?: BotCommandAdvancedFields["responseType"];
  responseAlternatives?: string[];
  pointsEffect?: import("@server/bot/command-points-effect").CommandPointsEffect | null;
  cooldownMessage?: string | null;
}

export const botCommands = {
  list: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BotCommandsListResponse> => {
    const response = await httpClient.get<BotCommandsListResponse>(
      ENDPOINTS.Internal.Bot.Commands,
      { params }
    );
    return (
      response.data ?? {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
      }
    );
  },

  getById: async (id: string): Promise<BotCommandRecord> => {
    const response = await httpClient.get<BotCommandRecord>(
      ENDPOINTS.Internal.Bot.CommandById(id)
    );
    return response.data;
  },

  create: async (
    payload: CreateBotCommandPayload
  ): Promise<BotCommandRecord> => {
    const response = await httpClient.post<BotCommandRecord>(
      ENDPOINTS.Internal.Bot.Commands,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<CreateBotCommandPayload>
  ): Promise<BotCommandRecord> => {
    const response = await httpClient.patch<BotCommandRecord>(
      ENDPOINTS.Internal.Bot.CommandById(id),
      payload
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Bot.CommandById(id));
  },

  getUsage: async (
    id: string,
    period: BotCommandUsagePeriod = "stream"
  ): Promise<BotCommandUsageStatsDto> => {
    const response = await httpClient.get<BotCommandUsageStatsDto>(
      ENDPOINTS.Internal.Bot.CommandUsage(id),
      { params: { period } }
    );
    return response.data;
  },
};
