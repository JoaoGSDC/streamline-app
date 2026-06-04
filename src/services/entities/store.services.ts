import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  StoreCategoryDto,
  StoreChannelConfigDto,
  StoreDashboardDto,
  StoreProductDto,
  StorePublicBalanceDto,
  StorePublicCatalogDto,
  StoreRedemptionDto,
} from "@server/store/store.types";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const store = {
  getDashboard: async (): Promise<StoreDashboardDto> => {
    const response = await httpClient.get<StoreDashboardDto>(
      ENDPOINTS.Internal.Store.Dashboard
    );
    return response.data;
  },

  getConfig: async (): Promise<StoreChannelConfigDto> => {
    const response = await httpClient.get<StoreChannelConfigDto>(
      ENDPOINTS.Internal.Store.Config
    );
    return response.data;
  },

  updateConfig: async (
    payload: Partial<
      Pick<
        StoreChannelConfigDto,
        "enabled" | "publicEnabled" | "defaultFulfillmentMode" | "pixieUsername"
      >
    >
  ): Promise<StoreChannelConfigDto> => {
    const response = await httpClient.patch<StoreChannelConfigDto>(
      ENDPOINTS.Internal.Store.Config,
      payload
    );
    return response.data;
  },

  listCategories: async (): Promise<{ items: StoreCategoryDto[] }> => {
    const response = await httpClient.get<{ items: StoreCategoryDto[] }>(
      ENDPOINTS.Internal.Store.Categories
    );
    return response.data ?? { items: [] };
  },

  createCategory: async (payload: {
    name: string;
    slug?: string;
    description?: string | null;
    enabled?: boolean;
  }): Promise<StoreCategoryDto> => {
    const response = await httpClient.post<StoreCategoryDto>(
      ENDPOINTS.Internal.Store.Categories,
      payload
    );
    return response.data;
  },

  updateCategory: async (
    id: string,
    payload: Partial<{
      name: string;
      slug: string;
      description: string | null;
      enabled: boolean;
      sortOrder: number;
    }>
  ): Promise<StoreCategoryDto> => {
    const response = await httpClient.patch<StoreCategoryDto>(
      ENDPOINTS.Internal.Store.CategoryById(id),
      payload
    );
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Store.CategoryById(id));
  },

  reorderCategories: async (orderedIds: string[]): Promise<void> => {
    await httpClient.patch(ENDPOINTS.Internal.Store.CategoriesReorder, {
      orderedIds,
    });
  },

  listProducts: async (params?: {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  }): Promise<PaginatedResponse<StoreProductDto>> => {
    const response = await httpClient.get<PaginatedResponse<StoreProductDto>>(
      ENDPOINTS.Internal.Store.Products,
      {
        params: {
          ...params,
          includeArchived: params?.includeArchived ? "1" : undefined,
        },
      }
    );
    return response.data ?? { items: [], total: 0, page: 1, limit: 20 };
  },

  getProduct: async (id: string): Promise<StoreProductDto> => {
    const response = await httpClient.get<StoreProductDto>(
      ENDPOINTS.Internal.Store.ProductById(id)
    );
    return response.data;
  },

  createProduct: async (
    payload: Record<string, unknown>
  ): Promise<StoreProductDto> => {
    const response = await httpClient.post<StoreProductDto>(
      ENDPOINTS.Internal.Store.Products,
      payload
    );
    return response.data;
  },

  updateProduct: async (
    id: string,
    payload: Record<string, unknown>
  ): Promise<StoreProductDto> => {
    const response = await httpClient.patch<StoreProductDto>(
      ENDPOINTS.Internal.Store.ProductById(id),
      payload
    );
    return response.data;
  },

  duplicateProduct: async (id: string): Promise<StoreProductDto> => {
    const response = await httpClient.post<StoreProductDto>(
      ENDPOINTS.Internal.Store.ProductDuplicate(id)
    );
    return response.data;
  },

  listRedemptions: async (params?: {
    search?: string;
    status?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StoreRedemptionDto>> => {
    const response = await httpClient.get<
      PaginatedResponse<StoreRedemptionDto>
    >(ENDPOINTS.Internal.Store.Redemptions, { params });
    return response.data ?? { items: [], total: 0, page: 1, limit: 20 };
  },

  updateRedemption: async (
    id: string,
    payload: {
      status: string;
      notes?: string | null;
      internalNotes?: string | null;
    }
  ): Promise<StoreRedemptionDto> => {
    const response = await httpClient.patch<StoreRedemptionDto>(
      ENDPOINTS.Internal.Store.RedemptionById(id),
      payload
    );
    return response.data;
  },

  refundRedemption: async (
    id: string,
    payload: { reason: string; refundPoints?: boolean; refundCoins?: boolean }
  ): Promise<StoreRedemptionDto> => {
    const response = await httpClient.post<StoreRedemptionDto>(
      ENDPOINTS.Internal.Store.RedemptionRefund(id),
      payload
    );
    return response.data;
  },

  exportRedemptionsCsv: (): string =>
    ENDPOINTS.Internal.Store.Redemptions + "?export=csv",

  getPublicCatalog: async (
    username: string
  ): Promise<StorePublicCatalogDto> => {
    const response = await httpClient.get<StorePublicCatalogDto>(
      ENDPOINTS.Internal.Store.PublicCatalog(username)
    );
    return response.data;
  },

  getPublicBalance: async (
    username: string
  ): Promise<StorePublicBalanceDto> => {
    const response = await httpClient.get<StorePublicBalanceDto>(
      ENDPOINTS.Internal.Store.PublicBalance(username)
    );
    return response.data;
  },

  redeemPublic: async (
    username: string,
    payload: {
      productId: string;
      payWith?: "points" | "coins" | "combined";
      idempotencyKey?: string;
    }
  ): Promise<StoreRedemptionDto> => {
    const response = await httpClient.post<StoreRedemptionDto>(
      ENDPOINTS.Internal.Store.PublicRedeem(username),
      payload
    );
    return response.data;
  },
};
