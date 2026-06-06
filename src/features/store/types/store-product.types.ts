import type {
  StoreFulfillmentMode,
  StorePriceMode,
  StoreProductRarity,
  StoreProductStatus,
  StoreProductType,
} from "@server/store/store.types";

export interface StoreProductRowState {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  productType: StoreProductType;
  rarity: StoreProductRarity | "" | null;
  pricePoints: number;
  priceCoins: number;
  priceMode: StorePriceMode;
  stockUnlimited: boolean;
  stockQuantity: number;
  fulfillmentMode: StoreFulfillmentMode;
  fulfillmentInstructions: string;
  featured: boolean;
  status: StoreProductStatus;
  subscribersOnly: boolean;
  vipOnly: boolean;
  secret: boolean;
  isDraft?: boolean;
  isNew?: boolean;
}
