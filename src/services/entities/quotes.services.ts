import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type {
  QuoteCategoryDto,
  QuoteDto,
  QuotesChannelConfigDto,
  QuotesDashboardDto,
  QuotesListResult,
} from "@server/quotes/quotes.types";

export const quotes = {
  getDashboard: async (): Promise<QuotesDashboardDto> => {
    const response = await httpClient.get<QuotesDashboardDto>(
      ENDPOINTS.Internal.Quotes.Dashboard
    );
    return response.data;
  },

  getConfig: async (): Promise<QuotesChannelConfigDto> => {
    const response = await httpClient.get<QuotesChannelConfigDto>(
      ENDPOINTS.Internal.Quotes.Config
    );
    return response.data;
  },

  updateConfig: async (
    payload: Partial<Pick<QuotesChannelConfigDto, "enabled" | "publicEnabled" | "autoCaptureContext">>
  ): Promise<QuotesChannelConfigDto> => {
    const response = await httpClient.patch<QuotesChannelConfigDto>(
      ENDPOINTS.Internal.Quotes.Config,
      payload
    );
    return response.data;
  },

  listQuotes: async (params?: Record<string, string | number | undefined>): Promise<QuotesListResult> => {
    const response = await httpClient.get<QuotesListResult>(
      ENDPOINTS.Internal.Quotes.Quotes,
      { params }
    );
    return response.data;
  },

  getQuote: async (id: string): Promise<QuoteDto> => {
    const response = await httpClient.get<QuoteDto>(
      ENDPOINTS.Internal.Quotes.QuoteById(id)
    );
    return response.data;
  },

  createQuote: async (payload: {
    text: string;
    speakerName: string;
    speakerType?: string;
    categoryId?: string | null;
    tagSlugs?: string[];
    markers?: {
      isFavorite?: boolean;
      isIconic?: boolean;
      isHistoric?: boolean;
      isChannelMeme?: boolean;
    };
    internalNotes?: string | null;
  }): Promise<QuoteDto> => {
    const response = await httpClient.post<QuoteDto>(
      ENDPOINTS.Internal.Quotes.Quotes,
      payload
    );
    return response.data;
  },

  updateQuote: async (
    id: string,
    payload: Partial<{
      text: string;
      speakerName: string;
      categoryId: string | null;
      tagSlugs: string[];
      status: "active" | "archived";
      markers: {
        isFavorite?: boolean;
        isIconic?: boolean;
        isHistoric?: boolean;
        isChannelMeme?: boolean;
      };
      internalNotes: string | null;
    }>
  ): Promise<QuoteDto> => {
    const response = await httpClient.patch<QuoteDto>(
      ENDPOINTS.Internal.Quotes.QuoteById(id),
      payload
    );
    return response.data;
  },

  archiveQuote: async (id: string): Promise<QuoteDto> => {
    const response = await httpClient.post<QuoteDto>(
      ENDPOINTS.Internal.Quotes.QuoteArchive(id)
    );
    return response.data;
  },

  deleteQuote: async (id: string): Promise<void> => {
    await httpClient.delete(ENDPOINTS.Internal.Quotes.QuoteById(id));
  },

  duplicateQuote: async (id: string): Promise<QuoteDto> => {
    const response = await httpClient.post<QuoteDto>(
      ENDPOINTS.Internal.Quotes.QuoteDuplicate(id)
    );
    return response.data;
  },

  listCategories: async (): Promise<{ items: QuoteCategoryDto[] }> => {
    const response = await httpClient.get<{ items: QuoteCategoryDto[] }>(
      ENDPOINTS.Internal.Quotes.Categories
    );
    return response.data ?? { items: [] };
  },

  createCategory: async (payload: {
    name: string;
    slug?: string;
    color?: string | null;
  }): Promise<QuoteCategoryDto> => {
    const response = await httpClient.post<QuoteCategoryDto>(
      ENDPOINTS.Internal.Quotes.Categories,
      payload
    );
    return response.data;
  },
};
