import {
  and,
  desc,
  eq,
  gte,
  isNull,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "./db";
import {
  channelViewerEconomy,
  platformUserCoins,
  storeAuditLog,
  storeBadgeDefinitions,
  storeCategories,
  storeChannelConfig,
  storeProducts,
  storeRedemptions,
  streamers,
} from "./schema";
import { getStreamerById } from "./db-queries";
import {
  adjustViewerPoints,
  getViewerBalance,
  upsertChannelViewer,
} from "./economy-db-queries";
import type {
  StoreCategoryDto,
  StoreChannelConfigDto,
  StoreDashboardDto,
  StoreFulfillmentMode,
  StoreLimitPeriod,
  StorePriceMode,
  StoreProductDto,
  StoreProductRarity,
  StoreProductStatus,
  StoreProductType,
  StorePublicBalanceDto,
  StorePublicCatalogDto,
  StoreRedemptionDto,
  StoreRedemptionStatusCounts,
  StoreRedemptionStatus,
} from "@server/store/store.types";
import { slugifyStoreText } from "@server/store/store.validators";
import {
  buildPixiePurchaseUrl,
  isProductVisibleInPublicCatalog,
  resolvePixieUsername,
} from "@server/store/store-product-utils";
import { HttpError } from "@server/utils/http-error";

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapCategoryRow(
  row: typeof storeCategories.$inferSelect,
  productCount?: number
): StoreCategoryDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    sortOrder: row.sortOrder,
    enabled: Boolean(row.enabled),
    isDefault: Boolean(row.isDefault),
    productCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapProductRow(
  row: typeof storeProducts.$inferSelect,
  extras?: { categoryName?: string; redemptionCount?: number }
): StoreProductDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    categoryId: row.categoryId,
    categoryName: extras?.categoryName,
    name: row.name,
    slug: row.slug,
    imageUrl: row.imageUrl ?? null,
    imageGallery: parseJsonArray(row.imageGallery),
    shortDescription: row.shortDescription ?? null,
    fullDescription: row.fullDescription ?? null,
    productType: row.productType as StoreProductType,
    rarity: (row.rarity as StoreProductRarity | null) ?? null,
    status: row.status as StoreProductStatus,
    stockQuantity: row.stockQuantity ?? null,
    stockUnlimited: Boolean(row.stockUnlimited),
    perUserLimit: row.perUserLimit ?? null,
    perUserLimitPeriod: (row.perUserLimitPeriod as StoreLimitPeriod | null) ?? null,
    cooldownMinutes: row.cooldownMinutes,
    pricePoints: row.pricePoints,
    priceCoins: row.priceCoins,
    priceMode: row.priceMode as StorePriceMode,
    startsAt: row.startsAt ?? null,
    endsAt: row.endsAt ?? null,
    sortOrder: row.sortOrder,
    tags: parseJsonArray(row.tags),
    featured: Boolean(row.featured),
    secret: Boolean(row.secret),
    subscribersOnly: Boolean(row.subscribersOnly),
    vipOnly: Boolean(row.vipOnly),
    followersOnly: Boolean(row.followersOnly),
    minFollowDays: row.minFollowDays,
    internalNotes: row.internalNotes ?? null,
    fulfillmentMode: row.fulfillmentMode as StoreFulfillmentMode,
    lowStockThreshold: row.lowStockThreshold ?? null,
    redemptionCount: extras?.redemptionCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRedemptionRow(
  row: typeof storeRedemptions.$inferSelect,
  product?: { name: string; slug: string; productType: string }
): StoreRedemptionDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    productId: row.productId,
    productName: product?.name ?? "",
    productSlug: product?.slug ?? "",
    productType: (product?.productType ?? "custom") as StoreProductType,
    twitchUserId: row.twitchUserId,
    twitchUsername: row.twitchUsername,
    displayName: row.displayName,
    status: row.status as StoreRedemptionStatus,
    paidPoints: row.paidPoints,
    paidCoins: row.paidCoins,
    notes: row.notes ?? null,
    internalNotes: row.internalNotes ?? null,
    handledByUserId: row.handledByUserId ?? null,
    handledByUsername: row.handledByUsername ?? null,
    refundPoints: row.refundPoints,
    refundCoins: row.refundCoins,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deliveredAt: row.deliveredAt ?? null,
  };
}

async function recordStoreAudit(input: {
  id: string;
  streamerId: string;
  actorUserId: string;
  actorUsername: string;
  entityType: string;
  entityId: string;
  action: string;
  payload?: unknown;
}) {
  await db.insert(storeAuditLog).values({
    id: input.id,
    streamerId: input.streamerId,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    payload: input.payload ? JSON.stringify(input.payload) : null,
    createdAt: new Date(),
  });
}

async function bumpStoreConfigVersion(streamerId: string): Promise<number> {
  const now = new Date();
  const rows = await db
    .select()
    .from(storeChannelConfig)
    .where(eq(storeChannelConfig.streamerId, streamerId))
    .limit(1);

  if (rows[0]) {
    const next = rows[0].configVersion + 1;
    await db
      .update(storeChannelConfig)
      .set({ configVersion: next, updatedAt: now })
      .where(eq(storeChannelConfig.streamerId, streamerId));
    return next;
  }
  return 1;
}

export async function isStreamerPartner(streamerId: string): Promise<boolean> {
  const streamer = await getStreamerById(streamerId);
  return Boolean(streamer?.partner);
}

async function seedDefaultBadges(streamerId: string) {
  const defaults = [
    { key: "frequent_buyer", name: "Comprador frequente", icon: "🛒" },
    { key: "collector", name: "Colecionador", icon: "📦" },
    { key: "top_buyer", name: "Top comprador", icon: "🏆" },
    { key: "supporter", name: "Apoiador", icon: "💜" },
    { key: "vip", name: "VIP", icon: "⭐" },
  ];
  const now = new Date();
  for (const badge of defaults) {
    const existing = await db
      .select()
      .from(storeBadgeDefinitions)
      .where(
        and(
          eq(storeBadgeDefinitions.streamerId, streamerId),
          eq(storeBadgeDefinitions.key, badge.key)
        )
      )
      .limit(1);
    if (!existing[0]) {
      await db.insert(storeBadgeDefinitions).values({
        id: `badge-${badge.key}-${streamerId}`,
        streamerId,
        key: badge.key,
        name: badge.name,
        description: null,
        icon: badge.icon,
        enabled: true,
        createdAt: now,
      });
    }
  }
}

export async function ensureStoreDefaults(streamerId: string): Promise<void> {
  const now = new Date();
  const [config] = await db
    .select()
    .from(storeChannelConfig)
    .where(eq(storeChannelConfig.streamerId, streamerId))
    .limit(1);

  if (!config) {
    await db.insert(storeChannelConfig).values({
      streamerId,
      enabled: false,
      publicEnabled: true,
      defaultFulfillmentMode: "approval",
      configVersion: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [defaultCategory] = await db
    .select()
    .from(storeCategories)
    .where(
      and(
        eq(storeCategories.streamerId, streamerId),
        eq(storeCategories.isDefault, true),
        isNull(storeCategories.deletedAt)
      )
    )
    .limit(1);

  if (!defaultCategory) {
    await db.insert(storeCategories).values({
      id: `cat-geral-${streamerId}`,
      streamerId,
      slug: "geral",
      name: "Geral",
      description: "Categoria padrão da loja",
      sortOrder: 0,
      enabled: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  await seedDefaultBadges(streamerId);
}

export async function getStoreConfig(
  streamerId: string
): Promise<StoreChannelConfigDto & { coinsAllowed: boolean }> {
  await ensureStoreDefaults(streamerId);
  const [row] = await db
    .select()
    .from(storeChannelConfig)
    .where(eq(storeChannelConfig.streamerId, streamerId))
    .limit(1);
  const coinsAllowed = await isStreamerPartner(streamerId);
  return {
    enabled: Boolean(row!.enabled),
    publicEnabled: Boolean(row!.publicEnabled),
    defaultFulfillmentMode: row!.defaultFulfillmentMode as StoreFulfillmentMode,
    pixieUsername: row!.pixieUsername ?? null,
    configVersion: row!.configVersion,
    updatedAt: row!.updatedAt,
    coinsAllowed,
  };
}

export async function updateStoreConfig(
  streamerId: string,
  patch: Partial<{
    enabled: boolean;
    publicEnabled: boolean;
    defaultFulfillmentMode: string;
    pixieUsername: string | null;
  }>,
  actor: { userId: string; username: string }
): Promise<StoreChannelConfigDto & { coinsAllowed: boolean }> {
  await ensureStoreDefaults(streamerId);
  const now = new Date();
  await db
    .update(storeChannelConfig)
    .set({ ...patch, updatedAt: now })
    .where(eq(storeChannelConfig.streamerId, streamerId));
  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-store-config-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "store_config",
    entityId: streamerId,
    action: "store_updated",
    payload: patch,
  });
  return getStoreConfig(streamerId);
}

export async function listStoreCategories(
  streamerId: string,
  includeDisabled = true
): Promise<StoreCategoryDto[]> {
  await ensureStoreDefaults(streamerId);
  const conditions = [
    eq(storeCategories.streamerId, streamerId),
    isNull(storeCategories.deletedAt),
  ];
  if (!includeDisabled) {
    conditions.push(eq(storeCategories.enabled, true));
  }

  const rows = await db
    .select()
    .from(storeCategories)
    .where(and(...conditions))
    .orderBy(storeCategories.sortOrder);

  const products = await db
    .select()
    .from(storeProducts)
    .where(
      and(eq(storeProducts.streamerId, streamerId), isNull(storeProducts.deletedAt))
    );

  const countByCategory = new Map<string, number>();
  for (const p of products) {
    countByCategory.set(p.categoryId, (countByCategory.get(p.categoryId) ?? 0) + 1);
  }

  return rows.map((row) =>
    mapCategoryRow(row, countByCategory.get(row.id) ?? 0)
  );
}

export async function createStoreCategory(
  streamerId: string,
  input: {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
    enabled?: boolean;
  },
  actor: { userId: string; username: string }
): Promise<StoreCategoryDto> {
  await ensureStoreDefaults(streamerId);
  const now = new Date();
  const slug = slugifyStoreText(input.slug ?? input.name);

  const [duplicate] = await db
    .select()
    .from(storeCategories)
    .where(
      and(
        eq(storeCategories.streamerId, streamerId),
        eq(storeCategories.slug, slug),
        isNull(storeCategories.deletedAt)
      )
    )
    .limit(1);

  if (duplicate) {
    throw new HttpError("Já existe uma categoria com este slug.", 409, "CONFLICT");
  }

  await db.insert(storeCategories).values({
    id: input.id,
    streamerId,
    slug,
    name: input.name,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0,
    enabled: input.enabled ?? true,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-cat-${input.id}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "category",
    entityId: input.id,
    action: "category_created",
  });

  const [row] = await db
    .select()
    .from(storeCategories)
    .where(eq(storeCategories.id, input.id))
    .limit(1);

  return mapCategoryRow(row!);
}

export async function updateStoreCategory(
  streamerId: string,
  categoryId: string,
  patch: Record<string, unknown>,
  actor: { userId: string; username: string }
): Promise<StoreCategoryDto> {
  const [existing] = await db
    .select()
    .from(storeCategories)
    .where(
      and(
        eq(storeCategories.id, categoryId),
        eq(storeCategories.streamerId, streamerId),
        isNull(storeCategories.deletedAt)
      )
    )
    .limit(1);

  if (!existing) {
    throw new HttpError("Categoria não encontrada", 404, "NOT_FOUND");
  }

  if (existing.isDefault && patch.enabled === false) {
    throw new HttpError("A categoria Geral não pode ser desativada.", 400, "VALIDATION_ERROR");
  }

  const dbPatch: Record<string, unknown> = { ...patch, updatedAt: new Date() };
  if (typeof patch.slug === "string") {
    dbPatch.slug = slugifyStoreText(patch.slug);
  }

  await db
    .update(storeCategories)
    .set(dbPatch)
    .where(eq(storeCategories.id, categoryId));

  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-cat-upd-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "category",
    entityId: categoryId,
    action: "category_updated",
    payload: patch,
  });

  const [row] = await db
    .select()
    .from(storeCategories)
    .where(eq(storeCategories.id, categoryId))
    .limit(1);

  return mapCategoryRow(row!);
}

export async function reorderStoreCategories(
  streamerId: string,
  orderedIds: string[],
  actor: { userId: string; username: string }
) {
  const now = new Date();
  for (let i = 0; i < orderedIds.length; i += 1) {
    await db
      .update(storeCategories)
      .set({ sortOrder: i, updatedAt: now })
      .where(
        and(
          eq(storeCategories.id, orderedIds[i]!),
          eq(storeCategories.streamerId, streamerId)
        )
      );
  }
  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-cat-reorder-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "category",
    entityId: streamerId,
    action: "category_updated",
    payload: { orderedIds },
  });
}

export async function deleteStoreCategory(
  streamerId: string,
  categoryId: string,
  actor: { userId: string; username: string }
) {
  const [existing] = await db
    .select()
    .from(storeCategories)
    .where(eq(storeCategories.id, categoryId))
    .limit(1);

  if (!existing || existing.streamerId !== streamerId) {
    throw new HttpError("Categoria não encontrada", 404, "NOT_FOUND");
  }
  if (existing.isDefault) {
    throw new HttpError("A categoria Geral não pode ser removida.", 400, "VALIDATION_ERROR");
  }

  const now = new Date();
  await db
    .update(storeCategories)
    .set({ deletedAt: now, enabled: false, updatedAt: now })
    .where(eq(storeCategories.id, categoryId));

  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-cat-del-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "category",
    entityId: categoryId,
    action: "category_deleted",
  });
}

async function getCategoryNameMap(streamerId: string) {
  const categories = await listStoreCategories(streamerId);
  return new Map(categories.map((c) => [c.id, c.name]));
}

export async function listStoreProducts(
  streamerId: string,
  options: {
    search?: string;
    categoryId?: string;
    status?: StoreProductStatus;
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  } = {}
): Promise<{ items: StoreProductDto[]; total: number; page: number; limit: number }> {
  await ensureStoreDefaults(streamerId);
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions = [
    eq(storeProducts.streamerId, streamerId),
    isNull(storeProducts.deletedAt),
  ];

  if (!options.includeArchived) {
    conditions.push(sql`${storeProducts.status} != 'archived'`);
  }
  if (options.categoryId) {
    conditions.push(eq(storeProducts.categoryId, options.categoryId));
  }
  if (options.status) {
    conditions.push(eq(storeProducts.status, options.status));
  }
  if (options.search?.trim()) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`LOWER(${storeProducts.name})`, term),
        like(sql`LOWER(${storeProducts.slug})`, term)
      )!
    );
  }

  const whereClause = and(...conditions);
  const allRows = await db.select().from(storeProducts).where(whereClause);
  const categoryNames = await getCategoryNameMap(streamerId);

  const sorted = allRows.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime());
  const total = sorted.length;
  const pageRows = sorted.slice(offset, offset + limit);

  return {
    items: pageRows.map((row) =>
      mapProductRow(row, { categoryName: categoryNames.get(row.categoryId) })
    ),
    total,
    page,
    limit,
  };
}

export async function getStoreProductById(
  streamerId: string,
  productId: string
): Promise<StoreProductDto | null> {
  const [row] = await db
    .select()
    .from(storeProducts)
    .where(
      and(
        eq(storeProducts.id, productId),
        eq(storeProducts.streamerId, streamerId),
        isNull(storeProducts.deletedAt)
      )
    )
    .limit(1);

  if (!row) return null;
  const categoryNames = await getCategoryNameMap(streamerId);
  return mapProductRow(row, { categoryName: categoryNames.get(row.categoryId) });
}

export async function createStoreProduct(
  streamerId: string,
  input: {
    id: string;
    categoryId: string;
    name: string;
    slug?: string;
    [key: string]: unknown;
  },
  actor: { userId: string; username: string }
): Promise<StoreProductDto> {
  await ensureStoreDefaults(streamerId);
  const partner = await isStreamerPartner(streamerId);
  const priceCoins = Number(input.priceCoins ?? 0);
  if (priceCoins > 0 && !partner) {
    throw new HttpError(
      "Coins só estão disponíveis para streamers parceiros.",
      403,
      "COINS_PARTNER_ONLY"
    );
  }

  const now = new Date();
  const slug = slugifyStoreText(String(input.slug ?? input.name));

  const [dup] = await db
    .select()
    .from(storeProducts)
    .where(
      and(
        eq(storeProducts.streamerId, streamerId),
        eq(storeProducts.slug, slug),
        isNull(storeProducts.deletedAt)
      )
    )
    .limit(1);

  if (dup) {
    throw new HttpError("Já existe um produto com este slug.", 409, "CONFLICT");
  }

  await db.insert(storeProducts).values({
    id: input.id,
    streamerId,
    categoryId: input.categoryId,
    name: input.name,
    slug,
    imageUrl: (input.imageUrl as string | null) ?? null,
    imageGallery: JSON.stringify(input.imageGallery ?? []),
    shortDescription: (input.shortDescription as string | null) ?? null,
    fullDescription: (input.fullDescription as string | null) ?? null,
    productType: (input.productType as string) ?? "custom",
    rarity: (input.rarity as string | null) ?? null,
    status: (input.status as string) ?? "inactive",
    stockQuantity: (input.stockQuantity as number | null) ?? null,
    stockUnlimited: input.stockUnlimited !== false,
    perUserLimit: (input.perUserLimit as number | null) ?? null,
    perUserLimitPeriod: (input.perUserLimitPeriod as string | null) ?? null,
    cooldownMinutes: Number(input.cooldownMinutes ?? 0),
    pricePoints: Number(input.pricePoints ?? 0),
    priceCoins,
    priceMode: (input.priceMode as string) ?? "points_only",
    startsAt: (input.startsAt as Date | null) ?? null,
    endsAt: (input.endsAt as Date | null) ?? null,
    sortOrder: Number(input.sortOrder ?? 0),
    tags: JSON.stringify(input.tags ?? []),
    featured: Boolean(input.featured),
    secret: Boolean(input.secret),
    subscribersOnly: Boolean(input.subscribersOnly),
    vipOnly: Boolean(input.vipOnly),
    followersOnly: Boolean(input.followersOnly),
    minFollowDays: Number(input.minFollowDays ?? 0),
    internalNotes: (input.internalNotes as string | null) ?? null,
    fulfillmentMode: (input.fulfillmentMode as string) ?? "approval",
    lowStockThreshold: (input.lowStockThreshold as number | null) ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-prod-${input.id}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "product",
    entityId: input.id,
    action: "product_created",
  });

  return (await getStoreProductById(streamerId, input.id))!;
}

export async function updateStoreProduct(
  streamerId: string,
  productId: string,
  patch: Record<string, unknown>,
  actor: { userId: string; username: string }
): Promise<StoreProductDto> {
  const existing = await getStoreProductById(streamerId, productId);
  if (!existing) {
    throw new HttpError("Produto não encontrado", 404, "NOT_FOUND");
  }

  const partner = await isStreamerPartner(streamerId);
  const nextCoins =
    patch.priceCoins !== undefined ? Number(patch.priceCoins) : existing.priceCoins;
  if (nextCoins > 0 && !partner) {
    throw new HttpError(
      "Coins só estão disponíveis para streamers parceiros.",
      403,
      "COINS_PARTNER_ONLY"
    );
  }

  const dbPatch: Record<string, unknown> = { ...patch, updatedAt: new Date() };
  if (patch.slug) dbPatch.slug = slugifyStoreText(String(patch.slug));
  if (patch.imageGallery) dbPatch.imageGallery = JSON.stringify(patch.imageGallery);
  if (patch.tags) dbPatch.tags = JSON.stringify(patch.tags);

  await db
    .update(storeProducts)
    .set(dbPatch)
    .where(eq(storeProducts.id, productId));

  await bumpStoreConfigVersion(streamerId);
  await recordStoreAudit({
    id: `audit-prod-upd-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "product",
    entityId: productId,
    action: "product_updated",
    payload: patch,
  });

  return (await getStoreProductById(streamerId, productId))!;
}

export async function duplicateStoreProduct(
  streamerId: string,
  productId: string,
  newId: string,
  actor: { userId: string; username: string }
): Promise<StoreProductDto> {
  const existing = await getStoreProductById(streamerId, productId);
  if (!existing) {
    throw new HttpError("Produto não encontrado", 404, "NOT_FOUND");
  }

  const slug = `${existing.slug}-copia-${Date.now().toString(36).slice(-4)}`;
  return createStoreProduct(
    streamerId,
    {
      id: newId,
      categoryId: existing.categoryId,
      name: `${existing.name} (cópia)`,
      slug,
      imageUrl: existing.imageUrl,
      imageGallery: existing.imageGallery,
      shortDescription: existing.shortDescription,
      fullDescription: existing.fullDescription,
      productType: existing.productType,
      rarity: existing.rarity,
      status: "inactive",
      stockQuantity: existing.stockQuantity,
      stockUnlimited: existing.stockUnlimited,
      perUserLimit: existing.perUserLimit,
      perUserLimitPeriod: existing.perUserLimitPeriod,
      cooldownMinutes: existing.cooldownMinutes,
      pricePoints: existing.pricePoints,
      priceCoins: existing.priceCoins,
      priceMode: existing.priceMode,
      startsAt: existing.startsAt,
      endsAt: existing.endsAt,
      sortOrder: existing.sortOrder + 1,
      tags: existing.tags,
      featured: false,
      secret: existing.secret,
      subscribersOnly: existing.subscribersOnly,
      vipOnly: existing.vipOnly,
      followersOnly: existing.followersOnly,
      minFollowDays: existing.minFollowDays,
      internalNotes: existing.internalNotes,
      fulfillmentMode: existing.fulfillmentMode,
      lowStockThreshold: existing.lowStockThreshold,
    },
    actor
  );
}

function periodStart(period: StoreLimitPeriod): Date {
  const now = new Date();
  if (period === "daily") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (period === "weekly") {
    const day = now.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (period === "monthly") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(0);
}

async function countUserRedemptionsForProduct(
  streamerId: string,
  productId: string,
  twitchUserId: string,
  since?: Date
) {
  const rows = await db
    .select()
    .from(storeRedemptions)
    .where(
      and(
        eq(storeRedemptions.streamerId, streamerId),
        eq(storeRedemptions.productId, productId),
        eq(storeRedemptions.twitchUserId, twitchUserId),
        sql`${storeRedemptions.status} NOT IN ('cancelled', 'refunded', 'expired')`
      )
    );

  if (!since) return rows.length;
  return rows.filter((r) => r.createdAt >= since).length;
}

function resolvePayment(
  product: StoreProductDto,
  payWith?: "points" | "coins" | "combined"
): { points: number; coins: number } {
  const mode = product.priceMode;
  if (mode === "points_only") {
    return { points: product.pricePoints, coins: 0 };
  }
  if (mode === "coins_only") {
    return { points: 0, coins: product.priceCoins };
  }
  if (mode === "combined") {
    return { points: product.pricePoints, coins: product.priceCoins };
  }
  // either
  if (payWith === "coins") return { points: 0, coins: product.priceCoins };
  if (payWith === "combined") {
    return { points: product.pricePoints, coins: product.priceCoins };
  }
  return { points: product.pricePoints, coins: 0 };
}

function initialRedemptionStatus(
  fulfillment: StoreFulfillmentMode
): StoreRedemptionStatus {
  if (fulfillment === "auto") return "delivered";
  if (fulfillment === "manual") return "pending";
  return "approved";
}

export async function createStoreRedemption(input: {
  id: string;
  streamerId: string;
  productId: string;
  twitchUserId: string;
  twitchUsername: string;
  displayName: string;
  payWith?: "points" | "coins" | "combined";
  idempotencyKey?: string;
  actorUserId: string;
  actorUsername: string;
}): Promise<StoreRedemptionDto> {
  await ensureStoreDefaults(input.streamerId);

  if (input.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(storeRedemptions)
      .where(
        and(
          eq(storeRedemptions.streamerId, input.streamerId),
          eq(storeRedemptions.idempotencyKey, input.idempotencyKey)
        )
      )
      .limit(1);
    if (existing) {
      const product = await getStoreProductById(input.streamerId, existing.productId);
      return mapRedemptionRow(existing, product ?? undefined);
    }
  }

  const config = await getStoreConfig(input.streamerId);
  if (!config.enabled) {
    throw new HttpError("A loja está desativada.", 403, "STORE_DISABLED");
  }

  const product = await getStoreProductById(input.streamerId, input.productId);
  if (!product || product.status !== "active") {
    throw new HttpError("Produto indisponível.", 404, "NOT_FOUND");
  }

  const now = new Date();
  if (product.startsAt && now < product.startsAt) {
    throw new HttpError("Produto ainda não está disponível.", 400, "NOT_AVAILABLE");
  }
  if (product.endsAt && now > product.endsAt) {
    throw new HttpError("Produto expirado.", 400, "NOT_AVAILABLE");
  }

  if (product.cooldownMinutes > 0) {
    const [last] = await db
      .select()
      .from(storeRedemptions)
      .where(
        and(
          eq(storeRedemptions.streamerId, input.streamerId),
          eq(storeRedemptions.productId, input.productId),
          eq(storeRedemptions.twitchUserId, input.twitchUserId)
        )
      )
      .orderBy(desc(storeRedemptions.createdAt))
      .limit(1);

    if (last) {
      const elapsedMs = now.getTime() - last.createdAt.getTime();
      if (elapsedMs < product.cooldownMinutes * 60_000) {
        throw new HttpError("Aguarde o cooldown para resgatar novamente.", 429, "COOLDOWN");
      }
    }
  }

  if (product.perUserLimit != null) {
    const since = product.perUserLimitPeriod
      ? periodStart(product.perUserLimitPeriod)
      : undefined;
    const count = await countUserRedemptionsForProduct(
      input.streamerId,
      input.productId,
      input.twitchUserId,
      since
    );
    if (count >= product.perUserLimit) {
      throw new HttpError("Limite de resgates atingido para este produto.", 403, "LIMIT_REACHED");
    }
  }

  const payment = resolvePayment(product, input.payWith);
  if (payment.coins > 0 && !config.coinsAllowed) {
    throw new HttpError("Coins não disponíveis nesta loja.", 403, "COINS_NOT_ALLOWED");
  }
  if (payment.points <= 0 && payment.coins <= 0) {
    throw new HttpError("Produto sem preço configurado.", 400, "VALIDATION_ERROR");
  }

  // Ensure viewer exists for points
  await upsertChannelViewer({
    id: `viewer-${input.twitchUserId}`,
    streamerId: input.streamerId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername,
    displayName: input.displayName,
  });

  // Deduct points
  if (payment.points > 0) {
    const [viewerRow] = await db
      .select()
      .from(channelViewerEconomy)
      .where(
        and(
          eq(channelViewerEconomy.streamerId, input.streamerId),
          eq(channelViewerEconomy.twitchUserId, input.twitchUserId)
        )
      )
      .limit(1);

    if (!viewerRow || viewerRow.points < payment.points) {
      throw new HttpError("Pontos insuficientes.", 402, "INSUFFICIENT_POINTS");
    }

    await db
      .update(channelViewerEconomy)
      .set({
        points: viewerRow.points - payment.points,
        updatedAt: now,
      })
      .where(eq(channelViewerEconomy.id, viewerRow.id));
  }

  // Deduct coins
  if (payment.coins > 0) {
    const [coinsRow] = await db
      .select()
      .from(platformUserCoins)
      .where(eq(platformUserCoins.twitchUserId, input.twitchUserId))
      .limit(1);

    if (!coinsRow || coinsRow.coins < payment.coins) {
      // rollback points if deducted
      if (payment.points > 0) {
        await db
          .update(channelViewerEconomy)
          .set({
            points: sql`${channelViewerEconomy.points} + ${payment.points}`,
            updatedAt: now,
          })
          .where(
            and(
              eq(channelViewerEconomy.streamerId, input.streamerId),
              eq(channelViewerEconomy.twitchUserId, input.twitchUserId)
            )
          );
      }
      throw new HttpError("Coins insuficientes.", 402, "INSUFFICIENT_COINS");
    }

    await db
      .update(platformUserCoins)
      .set({
        coins: coinsRow.coins - payment.coins,
        updatedAt: now,
      })
      .where(eq(platformUserCoins.twitchUserId, input.twitchUserId));
  }

  // Decrement stock
  if (!product.stockUnlimited) {
    const [stockRow] = await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.id, input.productId))
      .limit(1);

    if (!stockRow?.stockQuantity || stockRow.stockQuantity < 1) {
      if (payment.points > 0) {
        await db
          .update(channelViewerEconomy)
          .set({
            points: sql`${channelViewerEconomy.points} + ${payment.points}`,
            updatedAt: now,
          })
          .where(
            and(
              eq(channelViewerEconomy.streamerId, input.streamerId),
              eq(channelViewerEconomy.twitchUserId, input.twitchUserId)
            )
          );
      }
      if (payment.coins > 0) {
        await db
          .update(platformUserCoins)
          .set({
            coins: sql`${platformUserCoins.coins} + ${payment.coins}`,
            updatedAt: now,
          })
          .where(eq(platformUserCoins.twitchUserId, input.twitchUserId));
      }
      throw new HttpError("Produto esgotado.", 409, "OUT_OF_STOCK");
    }

    await db
      .update(storeProducts)
      .set({
        stockQuantity: stockRow.stockQuantity - 1,
        updatedAt: now,
      })
      .where(eq(storeProducts.id, input.productId));
  }

  const status = initialRedemptionStatus(product.fulfillmentMode);
  const deliveredAt = status === "delivered" ? now : null;

  await db.insert(storeRedemptions).values({
    id: input.id,
    streamerId: input.streamerId,
    productId: input.productId,
    twitchUserId: input.twitchUserId,
    twitchUsername: input.twitchUsername.toLowerCase(),
    displayName: input.displayName,
    status,
    paidPoints: payment.points,
    paidCoins: payment.coins,
    idempotencyKey: input.idempotencyKey ?? null,
    deliveredAt,
    createdAt: now,
    updatedAt: now,
  });

  await recordStoreAudit({
    id: `audit-red-${input.id}`,
    streamerId: input.streamerId,
    actorUserId: input.actorUserId,
    actorUsername: input.actorUsername,
    entityType: "redemption",
    entityId: input.id,
    action: "redemption_created",
    payload: { productId: input.productId, payment },
  });

  const [row] = await db
    .select()
    .from(storeRedemptions)
    .where(eq(storeRedemptions.id, input.id))
    .limit(1);

  return mapRedemptionRow(row!, {
    name: product.name,
    slug: product.slug,
    productType: product.productType,
  });
}

export async function listStoreRedemptions(
  streamerId: string,
  options: {
    search?: string;
    status?: StoreRedemptionStatus;
    productId?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  items: StoreRedemptionDto[];
  total: number;
  page: number;
  limit: number;
  statusCounts: StoreRedemptionStatusCounts;
}> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(storeRedemptions)
    .where(eq(storeRedemptions.streamerId, streamerId))
    .orderBy(desc(storeRedemptions.createdAt));

  let filtered = rows;
  if (options.status) {
    filtered = filtered.filter((r) => r.status === options.status);
  }
  if (options.productId) {
    filtered = filtered.filter((r) => r.productId === options.productId);
  }
  const productIdsAll = [...new Set(rows.map((r) => r.productId))];
  const productsForSearch = await Promise.all(
    productIdsAll.map((id) => getStoreProductById(streamerId, id))
  );
  const productNameMap = new Map(
    productsForSearch.filter(Boolean).map((p) => [p!.id, p!.name.toLowerCase()])
  );

  const statusCounts = {
    all: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    delivered: rows.filter((r) => r.status === "delivered").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
    refunded: rows.filter((r) => r.status === "refunded").length,
  };

  if (options.search?.trim()) {
    const term = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.twitchUsername.toLowerCase().includes(term) ||
        r.displayName.toLowerCase().includes(term) ||
        (productNameMap.get(r.productId) ?? "").includes(term)
    );
  }

  const productIds = [...new Set(filtered.map((r) => r.productId))];
  const products = await Promise.all(
    productIds.map((id) => getStoreProductById(streamerId, id))
  );
  const productMap = new Map(
    products.filter(Boolean).map((p) => [p!.id, p!])
  );

  const total = filtered.length;
  const pageItems = filtered.slice(offset, offset + limit);

  return {
    items: pageItems.map((row) => {
      const p = productMap.get(row.productId);
      return mapRedemptionRow(row, p);
    }),
    total,
    page,
    limit,
    statusCounts,
  };
}

function buildLast7DayKeys(): string[] {
  const days: string[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function buildDashboardMetrics7d(
  dayKeys: string[],
  products: StoreProductDto[],
  redemptions: StoreRedemptionDto[]
) {
  const productsByDay = new Map<string, number>();
  const redemptionsByDay = new Map<string, number>();
  const pointsByDay = new Map<string, number>();
  const coinsByDay = new Map<string, number>();

  for (const day of dayKeys) {
    productsByDay.set(day, 0);
    redemptionsByDay.set(day, 0);
    pointsByDay.set(day, 0);
    coinsByDay.set(day, 0);
  }

  for (const product of products) {
    const day = new Date(product.createdAt).toISOString().slice(0, 10);
    if (productsByDay.has(day)) {
      productsByDay.set(day, (productsByDay.get(day) ?? 0) + 1);
    }
  }

  for (const redemption of redemptions) {
    const day = new Date(redemption.createdAt).toISOString().slice(0, 10);
    if (!redemptionsByDay.has(day)) continue;
    redemptionsByDay.set(day, (redemptionsByDay.get(day) ?? 0) + 1);
    pointsByDay.set(day, (pointsByDay.get(day) ?? 0) + redemption.paidPoints);
    coinsByDay.set(day, (coinsByDay.get(day) ?? 0) + redemption.paidCoins);
  }

  let cumulativeProducts = products.filter((product) => {
    const created = new Date(product.createdAt).toISOString().slice(0, 10);
    return created < dayKeys[0];
  }).length;

  return {
    products: dayKeys.map((date) => {
      cumulativeProducts += productsByDay.get(date) ?? 0;
      return { date, value: cumulativeProducts };
    }),
    redemptions: dayKeys.map((date) => ({
      date,
      value: redemptionsByDay.get(date) ?? 0,
    })),
    pointsSpent: dayKeys.map((date) => ({
      date,
      value: pointsByDay.get(date) ?? 0,
    })),
    coinsSpent: dayKeys.map((date) => ({
      date,
      value: coinsByDay.get(date) ?? 0,
    })),
  };
}

export async function updateStoreRedemptionStatus(
  streamerId: string,
  redemptionId: string,
  input: {
    status: StoreRedemptionStatus;
    notes?: string | null;
    internalNotes?: string | null;
  },
  actor: { userId: string; username: string }
): Promise<StoreRedemptionDto> {
  const [row] = await db
    .select()
    .from(storeRedemptions)
    .where(
      and(
        eq(storeRedemptions.id, redemptionId),
        eq(storeRedemptions.streamerId, streamerId)
      )
    )
    .limit(1);

  if (!row) throw new HttpError("Resgate não encontrado", 404, "NOT_FOUND");

  const now = new Date();
  const patch: Record<string, unknown> = {
    status: input.status,
    notes: input.notes ?? row.notes,
    internalNotes: input.internalNotes ?? row.internalNotes,
    handledByUserId: actor.userId,
    handledByUsername: actor.username,
    updatedAt: now,
  };

  if (input.status === "delivered") patch.deliveredAt = now;
  if (input.status === "cancelled" || input.status === "expired") {
    patch.cancelledAt = now;
  }

  await db
    .update(storeRedemptions)
    .set(patch)
    .where(eq(storeRedemptions.id, redemptionId));

  await recordStoreAudit({
    id: `audit-red-st-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "redemption",
    entityId: redemptionId,
    action: `redemption_${input.status}`,
  });

  const product = await getStoreProductById(streamerId, row.productId);
  const [updated] = await db
    .select()
    .from(storeRedemptions)
    .where(eq(storeRedemptions.id, redemptionId))
    .limit(1);

  return mapRedemptionRow(updated!, product ?? undefined);
}

export async function refundStoreRedemption(
  streamerId: string,
  redemptionId: string,
  input: { refundPoints: boolean; refundCoins: boolean; reason: string },
  actor: { userId: string; username: string }
): Promise<StoreRedemptionDto> {
  const [row] = await db
    .select()
    .from(storeRedemptions)
    .where(
      and(
        eq(storeRedemptions.id, redemptionId),
        eq(storeRedemptions.streamerId, streamerId)
      )
    )
    .limit(1);

  if (!row) throw new HttpError("Resgate não encontrado", 404, "NOT_FOUND");
  if (row.status === "refunded") {
    throw new HttpError("Resgate já reembolsado.", 409, "ALREADY_REFUNDED");
  }

  const now = new Date();
  let refundPoints = 0;
  let refundCoins = 0;

  if (input.refundPoints && row.paidPoints > 0) {
    refundPoints = row.paidPoints;
    await adjustViewerPoints({
      auditId: `refund-pts-${redemptionId}`,
      streamerId,
      actorUserId: actor.userId,
      actorUsername: actor.username,
      twitchUserId: row.twitchUserId,
      twitchUsername: row.twitchUsername,
      displayName: row.displayName,
      viewerId: `viewer-${row.twitchUserId}`,
      delta: refundPoints,
      reason: input.reason,
    });
  }

  if (input.refundCoins && row.paidCoins > 0) {
    refundCoins = row.paidCoins;
    const [coins] = await db
      .select()
      .from(platformUserCoins)
      .where(eq(platformUserCoins.twitchUserId, row.twitchUserId))
      .limit(1);

    if (coins) {
      await db
        .update(platformUserCoins)
        .set({
          coins: coins.coins + refundCoins,
          updatedAt: now,
        })
        .where(eq(platformUserCoins.twitchUserId, row.twitchUserId));
    } else {
      await db.insert(platformUserCoins).values({
        twitchUserId: row.twitchUserId,
        twitchUsername: row.twitchUsername,
        displayName: row.displayName,
        coins: refundCoins,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await db
    .update(storeRedemptions)
    .set({
      status: "refunded",
      refundPoints,
      refundCoins,
      handledByUserId: actor.userId,
      handledByUsername: actor.username,
      updatedAt: now,
    })
    .where(eq(storeRedemptions.id, redemptionId));

  await recordStoreAudit({
    id: `audit-red-ref-${Date.now()}`,
    streamerId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: "redemption",
    entityId: redemptionId,
    action: "redemption_refunded",
    payload: { refundPoints, refundCoins, reason: input.reason },
  });

  const product = await getStoreProductById(streamerId, row.productId);
  const [updated] = await db
    .select()
    .from(storeRedemptions)
    .where(eq(storeRedemptions.id, redemptionId))
    .limit(1);

  return mapRedemptionRow(updated!, product ?? undefined);
}

export async function getStoreDashboard(
  streamerId: string
): Promise<StoreDashboardDto> {
  await ensureStoreDefaults(streamerId);
  const products = await listStoreProducts(streamerId, {
    limit: 1000,
    includeArchived: true,
  });
  const redemptions = await listStoreRedemptions(streamerId, { limit: 1000 });

  const activeProducts = products.items.filter((p) => p.status === "active");
  const pointsSpent = redemptions.items.reduce((s, r) => s + r.paidPoints, 0);
  const coinsSpent = redemptions.items.reduce((s, r) => s + r.paidCoins, 0);

  const countByProduct = new Map<string, number>();
  for (const r of redemptions.items) {
    countByProduct.set(r.productId, (countByProduct.get(r.productId) ?? 0) + 1);
  }

  const popularProducts = [...countByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, count]) => {
      const product = products.items.find((p) => p.id === productId)!;
      return { product, redemptionCount: count };
    })
    .filter((x) => x.product);

  const redeemerMap = new Map<
    string,
    {
      twitchUserId: string;
      twitchUsername: string;
      displayName: string;
      total: number;
      points: number;
      coins: number;
    }
  >();

  for (const r of redemptions.items) {
    const cur = redeemerMap.get(r.twitchUserId) ?? {
      twitchUserId: r.twitchUserId,
      twitchUsername: r.twitchUsername,
      displayName: r.displayName,
      total: 0,
      points: 0,
      coins: 0,
    };
    cur.total += 1;
    cur.points += r.paidPoints;
    cur.coins += r.paidCoins;
    redeemerMap.set(r.twitchUserId, cur);
  }

  const topRedeemers = [...redeemerMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((r) => ({
      twitchUserId: r.twitchUserId,
      twitchUsername: r.twitchUsername,
      displayName: r.displayName,
      totalRedemptions: r.total,
      pointsSpent: r.points,
      coinsSpent: r.coins,
    }));

  const lowStockProducts = activeProducts.filter(
    (p) =>
      !p.stockUnlimited &&
      p.stockQuantity != null &&
      (p.lowStockThreshold != null
        ? p.stockQuantity <= p.lowStockThreshold
        : p.stockQuantity <= 5)
  );

  const dayKeys = buildLast7DayKeys();

  return {
    totalProducts: products.total,
    activeProducts: activeProducts.length,
    totalRedemptions: redemptions.total,
    pendingRedemptions: redemptions.items.filter((r) => r.status === "pending")
      .length,
    pointsSpent,
    coinsSpent,
    metrics7d: buildDashboardMetrics7d(
      dayKeys,
      products.items,
      redemptions.items
    ),
    lowStockProducts,
    popularProducts,
    topRedeemers,
    featuredProducts: activeProducts.filter((p) => p.featured).slice(0, 8),
  };
}

export async function getPublicStoreCatalog(
  twitchUsername: string
): Promise<StorePublicCatalogDto | null> {
  const normalized = twitchUsername.trim().toLowerCase();
  const [streamerRow] = await db
    .select()
    .from(streamers)
    .where(eq(sql`LOWER(${streamers.twitchUsername})`, normalized))
    .limit(1);

  if (!streamerRow) return null;

  const config = await getStoreConfig(streamerRow.id);
  const coinsPurchase =
    config.coinsAllowed
      ? {
          pixieUsername: resolvePixieUsername(
            config.pixieUsername,
            streamerRow.twitchUsername
          ),
          pixieUrl: buildPixiePurchaseUrl(
            resolvePixieUsername(config.pixieUsername, streamerRow.twitchUsername)
          ),
        }
      : undefined;

  if (!config.enabled || !config.publicEnabled) {
    return {
      streamer: {
        id: streamerRow.id,
        name: streamerRow.name,
        twitchUsername: streamerRow.twitchUsername,
        avatar: streamerRow.avatar ?? null,
        partner: Boolean(streamerRow.partner),
      },
      config: {
        enabled: false,
        coinsAllowed: config.coinsAllowed,
        coinsPurchase,
      },
      categories: [],
      featuredProducts: [],
      recentProducts: [],
      popularProducts: [],
      products: [],
    };
  }

  const categories = await listStoreCategories(streamerRow.id, false);
  const { items: allProducts } = await listStoreProducts(streamerRow.id, {
    status: "active",
    limit: 500,
  });

  const visible = allProducts.filter((p) =>
    isProductVisibleInPublicCatalog(p, config.coinsAllowed)
  );
  const featuredProducts = visible.filter((p) => p.featured);
  const recentProducts = [...visible]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12);

  const dashboard = await getStoreDashboard(streamerRow.id);
  const popularProducts = dashboard.popularProducts
    .map((p) => p.product)
    .filter((p) => isProductVisibleInPublicCatalog(p, config.coinsAllowed));

  return {
    streamer: {
      id: streamerRow.id,
      name: streamerRow.name,
      twitchUsername: streamerRow.twitchUsername,
      avatar: streamerRow.avatar ?? null,
      partner: Boolean(streamerRow.partner),
    },
    config: {
      enabled: true,
      coinsAllowed: config.coinsAllowed,
      coinsPurchase,
    },
    categories,
    featuredProducts,
    recentProducts,
    popularProducts,
    products: visible,
  };
}

export async function exportStoreRedemptionsCsv(streamerId: string): Promise<string> {
  const { items } = await listStoreRedemptions(streamerId, { limit: 10000 });
  const header =
    "id,produto,usuario,status,pontos,coins,data\n";
  const lines = items.map(
    (r) =>
      `${r.id},"${r.productName}",${r.twitchUsername},${r.status},${r.paidPoints},${r.paidCoins},${r.createdAt.toISOString()}`
  );
  return header + lines.join("\n");
}

export async function getPublicStoreBalance(
  twitchUsername: string,
  twitchUserId: string | null
): Promise<StorePublicBalanceDto | null> {
  const catalog = await getPublicStoreCatalog(twitchUsername);
  if (!catalog?.config.enabled) return null;

  if (!twitchUserId) {
    return {
      authenticated: false,
      points: 0,
      coins: catalog.config.coinsAllowed ? 0 : null,
      coinsAllowed: catalog.config.coinsAllowed,
    };
  }

  const balance = await getViewerBalance(catalog.streamer.id, twitchUserId);

  return {
    authenticated: true,
    points: balance.channel?.points ?? 0,
    coins: catalog.config.coinsAllowed ? (balance.coins?.coins ?? 0) : null,
    coinsAllowed: catalog.config.coinsAllowed,
    displayName:
      balance.channel?.displayName ??
      balance.coins?.displayName ??
      undefined,
  };
}
