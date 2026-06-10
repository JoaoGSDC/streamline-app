import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  CounterCategoryDto,
  CounterDto,
  CounterHistoryEntryDto,
  CounterOperation,
  CountersChannelConfigDto,
  CountersDashboardDto,
  CountersListResult,
} from "@server/counters/counters.types";

export const counters = {
  getDashboard: async (): Promise<CountersDashboardDto> => {
    const response = await httpClient.get<CountersDashboardDto>(
      ENDPOINTS.Internal.Counters.Dashboard
    );
    return response.data;
  },

  getConfig: async (): Promise<CountersChannelConfigDto> => {
    const response = await httpClient.get<CountersChannelConfigDto>(
      ENDPOINTS.Internal.Counters.Config
    );
    return response.data;
  },

  updateConfig: async (
    payload: Partial<Pick<CountersChannelConfigDto, "enabled" | "liveModePins">>
  ): Promise<CountersChannelConfigDto> => {
    const response = await httpClient.patch<CountersChannelConfigDto>(
      ENDPOINTS.Internal.Counters.Config,
      payload
    );
    return response.data;
  },

  listCounters: async (params?: Record<string, string | undefined>): Promise<CountersListResult> => {
    const response = await httpClient.get<CountersListResult>(
      ENDPOINTS.Internal.Counters.Counters,
      { params }
    );
    return response.data;
  },

  getCounter: async (id: string): Promise<CounterDto> => {
    const response = await httpClient.get<CounterDto>(
      ENDPOINTS.Internal.Counters.CounterById(id)
    );
    return response.data;
  },

  createCounter: async (payload: {
    name: string;
    slug?: string;
    description?: string | null;
    type?: string;
    value?: number;
    goalValue?: number | null;
    color?: string;
    emoji?: string | null;
    categoryId?: string | null;
    tags?: string[];
  }): Promise<CounterDto> => {
    const response = await httpClient.post<CounterDto>(
      ENDPOINTS.Internal.Counters.Counters,
      payload
    );
    return response.data;
  },

  updateCounter: async (
    id: string,
    payload: Partial<{
      name: string;
      description: string | null;
      type: string;
      goalValue: number | null;
      color: string;
      emoji: string | null;
      categoryId: string | null;
      tags: string[];
      status: "active" | "archived";
    }>
  ): Promise<CounterDto> => {
    const response = await httpClient.patch<CounterDto>(
      ENDPOINTS.Internal.Counters.CounterById(id),
      payload
    );
    return response.data;
  },

  adjustCounter: async (
    id: string,
    payload: { operation: CounterOperation; amount?: number }
  ): Promise<CounterDto> => {
    const response = await httpClient.post<CounterDto>(
      ENDPOINTS.Internal.Counters.CounterAdjust(id),
      payload
    );
    return response.data;
  },

  archiveCounter: async (id: string): Promise<CounterDto> => {
    const response = await httpClient.post<CounterDto>(
      ENDPOINTS.Internal.Counters.CounterArchive(id)
    );
    return response.data;
  },

  deleteCounter: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Counters.CounterById(id));
  },

  duplicateCounter: async (id: string): Promise<CounterDto> => {
    const response = await httpClient.post<CounterDto>(
      ENDPOINTS.Internal.Counters.CounterDuplicate(id)
    );
    return response.data;
  },

  listHistory: async (params?: {
    counterId?: string;
    limit?: number;
  }): Promise<{ items: CounterHistoryEntryDto[] }> => {
    const response = await httpClient.get<{ items: CounterHistoryEntryDto[] }>(
      ENDPOINTS.Internal.Counters.History,
      { params }
    );
    return response.data ?? { items: [] };
  },

  listCategories: async (): Promise<{ items: CounterCategoryDto[] }> => {
    const response = await httpClient.get<{ items: CounterCategoryDto[] }>(
      ENDPOINTS.Internal.Counters.Categories
    );
    return response.data ?? { items: [] };
  },

  createCategory: async (payload: {
    name: string;
    slug?: string;
    color?: string | null;
  }): Promise<CounterCategoryDto> => {
    const response = await httpClient.post<CounterCategoryDto>(
      ENDPOINTS.Internal.Counters.Categories,
      payload
    );
    return response.data;
  },
};
