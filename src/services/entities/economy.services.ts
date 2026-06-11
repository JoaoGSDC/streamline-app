import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  ChannelViewerEconomyDto,
  EconomyFullConfigDto,
  EconomyOverviewDto,
  EconomyPointsBlocklistEntryDto,
  EconomyRankingEntryDto,
  PlatformUserCoinsDto,
  ViewerBalanceDto,
} from "@server/economy/economy.types";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface EconomyUserAdjustPayload {
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  amount: number;
  reason?: string;
  action: "add" | "remove";
}

export interface EconomyUserResetPayload {
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  resetPoints?: boolean;
  resetXp?: boolean;
  reason?: string;
}

export const economy = {
  getOverview: async (): Promise<EconomyOverviewDto> => {
    const response = await httpClient.get<EconomyOverviewDto>(
      ENDPOINTS.Internal.Economy.Overview
    );
    return response.data;
  },

  getConfig: async (): Promise<EconomyFullConfigDto> => {
    const response = await httpClient.get<EconomyFullConfigDto>(
      ENDPOINTS.Internal.Economy.Config
    );
    return response.data;
  },

  updateGeneral: async (
    payload: Partial<EconomyFullConfigDto["general"]>
  ) => {
    const response = await httpClient.patch(
      ENDPOINTS.Internal.Economy.ConfigGeneral,
      payload
    );
    return response.data;
  },

  updatePoints: async (
    payload: Partial<EconomyFullConfigDto["points"]>
  ) => {
    const response = await httpClient.patch(
      ENDPOINTS.Internal.Economy.ConfigPoints,
      payload
    );
    return response.data;
  },

  updateLevels: async (
    payload: Partial<EconomyFullConfigDto["levels"]>
  ) => {
    const response = await httpClient.patch(
      ENDPOINTS.Internal.Economy.ConfigLevels,
      payload
    );
    return response.data;
  },

  listUsers: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "points" | "level" | "activity";
  }): Promise<PaginatedResponse<ChannelViewerEconomyDto>> => {
    const response = await httpClient.get<
      PaginatedResponse<ChannelViewerEconomyDto>
    >(ENDPOINTS.Internal.Economy.Users, { params });
    return (
      response.data ?? { items: [], total: 0, page: 1, limit: 20 }
    );
  },

  addUser: async (payload: {
    twitchUserId?: string;
    twitchUsername: string;
    displayName?: string;
    initialPoints?: number;
  }): Promise<ChannelViewerEconomyDto> => {
    const response = await httpClient.post<ChannelViewerEconomyDto>(
      ENDPOINTS.Internal.Economy.Users,
      payload
    );
    return response.data;
  },

  getRanking: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<EconomyRankingEntryDto>> => {
    const response = await httpClient.get<
      PaginatedResponse<EconomyRankingEntryDto>
    >(ENDPOINTS.Internal.Economy.Ranking, { params });
    return (
      response.data ?? { items: [], total: 0, page: 1, limit: 20 }
    );
  },

  getBalance: async (twitchUserId: string): Promise<ViewerBalanceDto> => {
    const response = await httpClient.get<ViewerBalanceDto>(
      ENDPOINTS.Internal.Economy.UserBalance(twitchUserId)
    );
    return response.data;
  },

  adjustPoints: async (
    payload: EconomyUserAdjustPayload
  ): Promise<ChannelViewerEconomyDto> => {
    const response = await httpClient.post<ChannelViewerEconomyDto>(
      ENDPOINTS.Internal.Economy.AdjustPoints,
      payload
    );
    return response.data;
  },

  setPoints: async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    points: number;
    reason?: string;
  }): Promise<ChannelViewerEconomyDto> => {
    const response = await httpClient.post<ChannelViewerEconomyDto>(
      ENDPOINTS.Internal.Economy.SetPoints,
      payload
    );
    return response.data;
  },

  adjustCoins: async (
    payload: EconomyUserAdjustPayload
  ): Promise<PlatformUserCoinsDto> => {
    const response = await httpClient.post<PlatformUserCoinsDto>(
      ENDPOINTS.Internal.Economy.AdjustCoins,
      payload
    );
    return response.data;
  },

  resetUser: async (
    payload: EconomyUserResetPayload
  ): Promise<ChannelViewerEconomyDto> => {
    const response = await httpClient.post<ChannelViewerEconomyDto>(
      ENDPOINTS.Internal.Economy.ResetUser,
      payload
    );
    return response.data;
  },

  removeUser: async (payload: {
    viewerId: string;
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    reason?: string;
  }): Promise<void> => {
    await httpClient.post(ENDPOINTS.Internal.Economy.RemoveUser, payload);
  },

  resetAllPoints: async (payload: {
    reason: string;
    confirmPhrase: "RESETAR TODOS OS PONTOS";
  }) => {
    const response = await httpClient.post(
      ENDPOINTS.Internal.Economy.ResetAllPoints,
      payload
    );
    return response.data as { affected: number };
  },

  listPointsBlocklist: async (): Promise<EconomyPointsBlocklistEntryDto[]> => {
    const response = await httpClient.get<EconomyPointsBlocklistEntryDto[]>(
      ENDPOINTS.Internal.Economy.PointsBlocklist
    );
    return response.data;
  },

  addPointsBlocklist: async (payload: {
    twitchLogin: string;
    twitchUserId?: string;
    displayName?: string;
    reason?: string;
  }): Promise<EconomyPointsBlocklistEntryDto> => {
    const response = await httpClient.post<EconomyPointsBlocklistEntryDto>(
      ENDPOINTS.Internal.Economy.PointsBlocklist,
      payload
    );
    return response.data;
  },

  removePointsBlocklist: async (entryId: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Economy.PointsBlocklistEntry(entryId));
  },
};
