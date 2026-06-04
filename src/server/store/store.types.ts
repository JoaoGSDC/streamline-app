export type StoreProductType =
  | "interaction"
  | "virtual"
  | "physical"
  | "community"
  | "stream_benefit"
  | "custom";

export type StoreProductRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type StoreProductStatus = "active" | "inactive" | "archived";

export type StorePriceMode = "points_only" | "coins_only" | "combined" | "either";

export type StoreFulfillmentMode = "auto" | "manual" | "approval";

export type StoreRedemptionStatus =
  | "pending"
  | "approved"
  | "delivered"
  | "cancelled"
  | "expired"
  | "refunded";

export type StoreLimitPeriod = "lifetime" | "daily" | "weekly" | "monthly";

export type StoreAuditAction =
  | "store_created"
  | "store_updated"
  | "category_created"
  | "category_updated"
  | "category_deleted"
  | "product_created"
  | "product_updated"
  | "product_archived"
  | "product_duplicated"
  | "redemption_created"
  | "redemption_approved"
  | "redemption_delivered"
  | "redemption_cancelled"
  | "redemption_refunded";

export const STORE_RARITY_LABELS: Record<StoreProductRarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

export const STORE_PRODUCT_TYPE_LABELS: Record<StoreProductType, string> = {
  interaction: "Interação",
  virtual: "Produto virtual",
  physical: "Produto físico",
  community: "Benefício de comunidade",
  stream_benefit: "Benefício da stream",
  custom: "Customizado",
};

export interface StoreChannelConfigDto {
  enabled: boolean;
  publicEnabled: boolean;
  coinsAllowed: boolean;
  defaultFulfillmentMode: StoreFulfillmentMode;
  pixieUsername: string | null;
  configVersion: number;
  updatedAt: Date;
}

export interface StoreCategoryDto {
  id: string;
  streamerId: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  enabled: boolean;
  isDefault: boolean;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreProductDto {
  id: string;
  streamerId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageGallery: string[];
  shortDescription: string | null;
  fullDescription: string | null;
  productType: StoreProductType;
  rarity: StoreProductRarity | null;
  status: StoreProductStatus;
  stockQuantity: number | null;
  stockUnlimited: boolean;
  perUserLimit: number | null;
  perUserLimitPeriod: StoreLimitPeriod | null;
  cooldownMinutes: number;
  pricePoints: number;
  priceCoins: number;
  priceMode: StorePriceMode;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
  tags: string[];
  featured: boolean;
  secret: boolean;
  subscribersOnly: boolean;
  vipOnly: boolean;
  followersOnly: boolean;
  minFollowDays: number;
  internalNotes: string | null;
  fulfillmentMode: StoreFulfillmentMode;
  lowStockThreshold: number | null;
  redemptionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreRedemptionDto {
  id: string;
  streamerId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productType: StoreProductType;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  status: StoreRedemptionStatus;
  paidPoints: number;
  paidCoins: number;
  notes: string | null;
  internalNotes: string | null;
  handledByUserId: string | null;
  handledByUsername: string | null;
  refundPoints: number;
  refundCoins: number;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
}

export interface StoreDashboardDto {
  totalProducts: number;
  activeProducts: number;
  totalRedemptions: number;
  pendingRedemptions: number;
  pointsSpent: number;
  coinsSpent: number;
  lowStockProducts: StoreProductDto[];
  popularProducts: Array<{ product: StoreProductDto; redemptionCount: number }>;
  topRedeemers: Array<{
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    totalRedemptions: number;
    pointsSpent: number;
    coinsSpent: number;
  }>;
  featuredProducts: StoreProductDto[];
}

export type StoreProductSort =
  | "default"
  | "name_asc"
  | "name_desc"
  | "points_asc"
  | "points_desc"
  | "coins_asc"
  | "coins_desc"
  | "newest";

export interface StorePublicBalanceDto {
  authenticated: boolean;
  points: number;
  coins: number | null;
  coinsAllowed: boolean;
  displayName?: string;
}

export interface StorePublicCatalogDto {
  streamer: {
    id: string;
    name: string;
    twitchUsername: string;
    avatar: string | null;
    partner: boolean;
  };
  config: {
    enabled: boolean;
    coinsAllowed: boolean;
    coinsPurchase?: {
      pixieUsername: string;
      pixieUrl: string;
    };
  };
  categories: StoreCategoryDto[];
  featuredProducts: StoreProductDto[];
  recentProducts: StoreProductDto[];
  popularProducts: StoreProductDto[];
  products: StoreProductDto[];
}

/** Estrutura preparada para badges (sem regras complexas ainda) */
export interface StoreBadgeDefinitionDto {
  id: string;
  streamerId: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  enabled: boolean;
  createdAt: Date;
}
