import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export type BotBlacklistMatchType = "exact" | "contains" | "regex";
export type BotBlacklistAction = "delete" | "timeout";

export interface BotBlacklistRecord {
  id: string;
  streamerId: string;
  term: string;
  matchType: BotBlacklistMatchType;
  action: BotBlacklistAction;
  timeoutSeconds: number | null;
  enabled: boolean;
  configVersion?: number;
}

export interface CreateBotBlacklistPayload {
  term: string;
  matchType?: BotBlacklistMatchType;
  action?: BotBlacklistAction;
  timeoutSeconds?: number;
  enabled?: boolean;
}

export const botBlacklist = {
  list: async (search?: string): Promise<BotBlacklistRecord[]> => {
    const response = await httpClient.get<{ items: BotBlacklistRecord[] }>(
      ENDPOINTS.Internal.Bot.Blacklist,
      { params: search ? { search } : undefined }
    );
    return response.data?.items ?? [];
  },

  create: async (
    payload: CreateBotBlacklistPayload
  ): Promise<BotBlacklistRecord> => {
    const response = await httpClient.post<BotBlacklistRecord>(
      ENDPOINTS.Internal.Bot.Blacklist,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<CreateBotBlacklistPayload>
  ): Promise<BotBlacklistRecord> => {
    const response = await httpClient.patch<BotBlacklistRecord>(
      ENDPOINTS.Internal.Bot.BlacklistById(id),
      payload
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Bot.BlacklistById(id));
  },
};
