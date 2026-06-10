export type QuoteStatus = "active" | "archived";
export type QuoteSource =
  | "panel"
  | "chat_command"
  | "automation"
  | "api"
  | "import";
export type QuoteSpeakerType =
  | "streamer"
  | "moderator"
  | "viewer"
  | "guest"
  | "custom";

export interface QuoteStreamContextInput {
  platform?: string;
  streamTitle?: string | null;
  streamCategory?: string | null;
  gameName?: string | null;
  streamTags?: string[];
  streamStartedAt?: Date | string | null;
  streamElapsedSeconds?: number | null;
}

export interface QuoteCategoryDto {
  id: string;
  streamerId: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  enabled: boolean;
  quoteCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteTagDto {
  id: string;
  streamerId: string;
  slug: string;
  name: string;
  usageCount: number;
  createdAt: Date;
}

export interface QuoteDto {
  id: string;
  streamerId: string;
  number: number;
  text: string;
  speakerType: QuoteSpeakerType;
  speakerName: string;
  speakerTwitchId: string | null;
  registeredByUserId: string | null;
  registeredByUsername: string;
  registeredByRole: string;
  source: QuoteSource;
  occurredAt: Date;
  timezone: string;
  platform: string;
  streamTitle: string | null;
  streamCategory: string | null;
  gameName: string | null;
  streamTags: string[];
  streamStartedAt: Date | null;
  streamElapsedSeconds: number | null;
  categoryId: string | null;
  categoryName: string | null;
  tags: QuoteTagDto[];
  isFavorite: boolean;
  isIconic: boolean;
  isHistoric: boolean;
  isChannelMeme: boolean;
  displayCount: number;
  shareCount: number;
  customFields: Record<string, unknown>;
  internalNotes: string | null;
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotesChannelConfigDto {
  streamerId: string;
  enabled: boolean;
  publicEnabled: boolean;
  autoCaptureContext: boolean;
  configVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotesDashboardDto {
  totalQuotes: number;
  quotesThisWeek: number;
  totalDisplays: number;
  iconicCount: number;
  topCategories: Array<{ name: string; count: number }>;
  topGames: Array<{ name: string; count: number }>;
  mostDisplayed: Array<{ number: number; text: string; displayCount: number }>;
  recentActivity: Array<{
    quoteId: string;
    number: number;
    action: string;
    actorUsername: string;
    occurredAt: Date;
  }>;
}

export interface QuotesListResult {
  items: QuoteDto[];
  total: number;
  page: number;
  limit: number;
}

export interface QuoteListFilters {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  tagSlug?: string;
  gameName?: string;
  speakerName?: string;
  source?: QuoteSource;
  status?: QuoteStatus;
  from?: Date;
  to?: Date;
  markers?: Array<"favorite" | "iconic" | "historic" | "channel_meme">;
  page?: number;
  limit?: number;
}

export interface CreateQuoteInput {
  id: string;
  streamerId: string;
  text: string;
  speakerType?: QuoteSpeakerType;
  speakerName: string;
  speakerTwitchId?: string | null;
  registeredByUserId?: string | null;
  registeredByUsername: string;
  registeredByRole: string;
  source: QuoteSource;
  occurredAt?: Date;
  timezone?: string;
  streamContext?: QuoteStreamContextInput;
  categoryId?: string | null;
  tagSlugs?: string[];
  isFavorite?: boolean;
  isIconic?: boolean;
  isHistoric?: boolean;
  isChannelMeme?: boolean;
  internalNotes?: string | null;
  customFields?: Record<string, unknown>;
}

export interface BotCreateQuoteInput {
  text: string;
  speakerName?: string;
  speakerType?: QuoteSpeakerType;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  registeredByRole?: string;
  streamContext?: QuoteStreamContextInput;
}

export interface BotQuoteQuery {
  number?: number;
  categorySlug?: string;
  tagSlug?: string;
  gameName?: string;
}
