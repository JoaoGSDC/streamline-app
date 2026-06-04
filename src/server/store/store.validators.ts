import { z, type ZodIssue } from "zod";

export function formatStoreZodError(error: z.ZodError): string {
  return error.issues.map((issue: ZodIssue) => issue.message).join("; ");
}

const productTypeSchema = z.enum([
  "interaction",
  "virtual",
  "physical",
  "community",
  "stream_benefit",
  "custom",
]);

const raritySchema = z.enum([
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
]);

const priceModeSchema = z.enum([
  "points_only",
  "coins_only",
  "combined",
  "either",
]);

const fulfillmentSchema = z.enum(["auto", "manual", "approval"]);

const limitPeriodSchema = z.enum(["lifetime", "daily", "weekly", "monthly"]);

export const updateStoreConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicEnabled: z.boolean().optional(),
  defaultFulfillmentMode: fulfillmentSchema.optional(),
});

export const createStoreCategorySchema = z.object({
  name: z.string().min(1).max(64),
  slug: z.string().min(1).max(64).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

export const updateStoreCategorySchema = createStoreCategorySchema.partial();

export const reorderStoreCategoriesSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const storeProductBaseSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  imageUrl: z.string().url().nullable().optional(),
  imageGallery: z.array(z.string().url()).optional(),
  shortDescription: z.string().max(300).nullable().optional(),
  fullDescription: z.string().max(10000).nullable().optional(),
  productType: productTypeSchema.optional(),
  rarity: raritySchema.nullable().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  stockQuantity: z.coerce.number().int().min(0).nullable().optional(),
  stockUnlimited: z.boolean().optional(),
  perUserLimit: z.coerce.number().int().min(1).nullable().optional(),
  perUserLimitPeriod: limitPeriodSchema.nullable().optional(),
  cooldownMinutes: z.coerce.number().int().min(0).max(525600).optional(),
  pricePoints: z.coerce.number().int().min(0).max(10_000_000).optional(),
  priceCoins: z.coerce.number().int().min(0).max(10_000_000).optional(),
  priceMode: priceModeSchema.optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  tags: z.array(z.string().max(32)).max(20).optional(),
  featured: z.boolean().optional(),
  secret: z.boolean().optional(),
  subscribersOnly: z.boolean().optional(),
  vipOnly: z.boolean().optional(),
  followersOnly: z.boolean().optional(),
  minFollowDays: z.coerce.number().int().min(0).optional(),
  internalNotes: z.string().max(2000).nullable().optional(),
  fulfillmentMode: fulfillmentSchema.optional(),
  lowStockThreshold: z.coerce.number().int().min(0).nullable().optional(),
});

export const createStoreProductSchema = storeProductBaseSchema;
export const updateStoreProductSchema = storeProductBaseSchema.partial();

export const updateRedemptionStatusSchema = z.object({
  status: z.enum([
    "pending",
    "approved",
    "delivered",
    "cancelled",
    "expired",
    "refunded",
  ]),
  notes: z.string().max(2000).nullable().optional(),
  internalNotes: z.string().max(2000).nullable().optional(),
});

export const refundRedemptionSchema = z.object({
  refundPoints: z.boolean().optional().default(true),
  refundCoins: z.boolean().optional().default(true),
  reason: z.string().min(3).max(500),
});

export const publicRedeemSchema = z.object({
  productId: z.string().min(1),
  payWith: z.enum(["points", "coins", "combined"]).optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export const botStoreRedeemSchema = z.object({
  productId: z.string().min(1),
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1).max(64),
  displayName: z.string().min(1).max(64),
  payWith: z.enum(["points", "coins", "combined"]).optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export function slugifyStoreText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
