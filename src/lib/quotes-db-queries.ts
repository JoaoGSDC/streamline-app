import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "./db";
import {
  quoteCategories,
  quoteTagAssignments,
  quoteTags,
  quotes,
  quotesChannelConfig,
} from "./schema";
import type {
  BotCreateQuoteInput,
  BotQuoteQuery,
  CreateQuoteInput,
  QuoteCategoryDto,
  QuoteDto,
  QuoteListFilters,
  QuotesChannelConfigDto,
  QuotesDashboardDto,
  QuotesListResult,
  QuoteTagDto,
} from "@server/quotes/quotes.types";
import {
  normalizeQuoteSearchText,
  slugifyQuoteText,
} from "@server/quotes/quotes.validators";
import { HttpError } from "@server/utils/http-error";
import { createRandomString } from "@utils/factories/create-random-string";

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function bumpQuotesConfigVersion(streamerId: string) {
  const now = new Date();
  await db
    .update(quotesChannelConfig)
    .set({ configVersion: sql`${quotesChannelConfig.configVersion} + 1`, updatedAt: now })
    .where(eq(quotesChannelConfig.streamerId, streamerId));
}

async function ensureQuotesConfig(streamerId: string): Promise<QuotesChannelConfigDto> {
  const existing = await db
    .select()
    .from(quotesChannelConfig)
    .where(eq(quotesChannelConfig.streamerId, streamerId))
    .limit(1);

  if (existing[0]) {
    return mapConfigRow(existing[0]);
  }

  const now = new Date();
  await db.insert(quotesChannelConfig).values({
    streamerId,
    enabled: true,
    publicEnabled: false,
    autoCaptureContext: true,
    configVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  return {
    streamerId,
    enabled: true,
    publicEnabled: false,
    autoCaptureContext: true,
    configVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function mapConfigRow(
  row: typeof quotesChannelConfig.$inferSelect
): QuotesChannelConfigDto {
  return {
    streamerId: row.streamerId,
    enabled: Boolean(row.enabled),
    publicEnabled: Boolean(row.publicEnabled),
    autoCaptureContext: Boolean(row.autoCaptureContext),
    configVersion: row.configVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadTagsForQuotes(quoteIds: string[]): Promise<Map<string, QuoteTagDto[]>> {
  const map = new Map<string, QuoteTagDto[]>();
  if (quoteIds.length === 0) return map;

  const assignments = await db
    .select()
    .from(quoteTagAssignments)
    .where(inArray(quoteTagAssignments.quoteId, quoteIds));

  if (assignments.length === 0) return map;

  const tagIds = [...new Set(assignments.map((row) => row.tagId))];
  const tagRows = await db.select().from(quoteTags).where(inArray(quoteTags.id, tagIds));
  const tagsById = new Map(tagRows.map((tag) => [tag.id, tag]));

  for (const assignment of assignments) {
    const tag = tagsById.get(assignment.tagId);
    if (!tag) continue;
    const list = map.get(assignment.quoteId) ?? [];
    list.push({
      id: tag.id,
      streamerId: tag.streamerId,
      slug: tag.slug,
      name: tag.name,
      usageCount: tag.usageCount,
      createdAt: tag.createdAt,
    });
    map.set(assignment.quoteId, list);
  }

  return map;
}

function mapQuoteRow(
  row: typeof quotes.$inferSelect,
  extras?: { categoryName?: string | null; tags?: QuoteTagDto[] }
): QuoteDto {
  return {
    id: row.id,
    streamerId: row.streamerId,
    number: row.number,
    text: row.text,
    speakerType: row.speakerType as QuoteDto["speakerType"],
    speakerName: row.speakerName,
    speakerTwitchId: row.speakerTwitchId ?? null,
    registeredByUserId: row.registeredByUserId ?? null,
    registeredByUsername: row.registeredByUsername,
    registeredByRole: row.registeredByRole,
    source: row.source as QuoteDto["source"],
    occurredAt: row.occurredAt,
    timezone: row.timezone,
    platform: row.platform,
    streamTitle: row.streamTitle ?? null,
    streamCategory: row.streamCategory ?? null,
    gameName: row.gameName ?? null,
    streamTags: parseJsonArray(row.streamTags),
    streamStartedAt: row.streamStartedAt ?? null,
    streamElapsedSeconds: row.streamElapsedSeconds ?? null,
    categoryId: row.categoryId ?? null,
    categoryName: extras?.categoryName ?? null,
    tags: extras?.tags ?? [],
    isFavorite: Boolean(row.isFavorite),
    isIconic: Boolean(row.isIconic),
    isHistoric: Boolean(row.isHistoric),
    isChannelMeme: Boolean(row.isChannelMeme),
    displayCount: row.displayCount,
    shareCount: row.shareCount,
    customFields: parseJsonObject(row.customFields),
    internalNotes: row.internalNotes ?? null,
    status: row.status as QuoteDto["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function nextQuoteNumber(streamerId: string): Promise<number> {
  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.streamerId, streamerId))
    .orderBy(desc(quotes.number))
    .limit(1);
  return (rows[0]?.number ?? 0) + 1;
}

async function upsertTags(
  streamerId: string,
  tagSlugs: string[] | undefined
): Promise<string[]> {
  if (!tagSlugs?.length) return [];
  const tagIds: string[] = [];
  const now = new Date();

  for (const raw of tagSlugs) {
    const slug = slugifyQuoteText(raw);
    if (!slug) continue;

    const existing = await db
      .select()
      .from(quoteTags)
      .where(and(eq(quoteTags.streamerId, streamerId), eq(quoteTags.slug, slug)))
      .limit(1);

    if (existing[0]) {
      tagIds.push(existing[0].id);
      continue;
    }

    const id = createRandomString(12);
    await db.insert(quoteTags).values({
      id,
      streamerId,
      slug,
      name: raw.trim(),
      usageCount: 0,
      createdAt: now,
    });
    tagIds.push(id);
  }

  return tagIds;
}

async function assignTagsToQuote(quoteId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;

  for (const tagId of tagIds) {
    await db
      .insert(quoteTagAssignments)
      .values({ quoteId, tagId })
      .onConflictDoNothing();
  }

  for (const tagId of tagIds) {
    await db
      .update(quoteTags)
      .set({ usageCount: sql`${quoteTags.usageCount} + 1` })
      .where(eq(quoteTags.id, tagId));
  }
}

async function replaceQuoteTags(quoteId: string, tagIds: string[]) {
  await db.delete(quoteTagAssignments).where(eq(quoteTagAssignments.quoteId, quoteId));
  await assignTagsToQuote(quoteId, tagIds);
}

export async function getQuotesConfig(streamerId: string): Promise<QuotesChannelConfigDto> {
  return ensureQuotesConfig(streamerId);
}

export async function updateQuotesConfig(
  streamerId: string,
  patch: Partial<Pick<QuotesChannelConfigDto, "enabled" | "publicEnabled" | "autoCaptureContext">>
): Promise<QuotesChannelConfigDto> {
  await ensureQuotesConfig(streamerId);
  const now = new Date();

  await db
    .update(quotesChannelConfig)
    .set({
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(patch.publicEnabled !== undefined ? { publicEnabled: patch.publicEnabled } : {}),
      ...(patch.autoCaptureContext !== undefined
        ? { autoCaptureContext: patch.autoCaptureContext }
        : {}),
      configVersion: sql`${quotesChannelConfig.configVersion} + 1`,
      updatedAt: now,
    })
    .where(eq(quotesChannelConfig.streamerId, streamerId));

  return getQuotesConfig(streamerId);
}

export async function listQuoteCategories(
  streamerId: string
): Promise<{ items: QuoteCategoryDto[] }> {
  const rows = await db
    .select()
    .from(quoteCategories)
    .where(
      and(eq(quoteCategories.streamerId, streamerId), isNull(quoteCategories.deletedAt))
    )
    .orderBy(quoteCategories.sortOrder, quoteCategories.name);

  return {
    items: rows.map((row) => ({
      id: row.id,
      streamerId: row.streamerId,
      slug: row.slug,
      name: row.name,
      description: row.description ?? null,
      color: row.color ?? null,
      sortOrder: row.sortOrder,
      enabled: Boolean(row.enabled),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  };
}

export async function createQuoteCategory(input: {
  id: string;
  streamerId: string;
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  enabled?: boolean;
}): Promise<QuoteCategoryDto> {
  const now = new Date();
  const slug = input.slug?.trim() ? slugifyQuoteText(input.slug) : slugifyQuoteText(input.name);

  await db.insert(quoteCategories).values({
    id: input.id,
    streamerId: input.streamerId,
    slug,
    name: input.name.trim(),
    description: input.description ?? null,
    color: input.color ?? null,
    sortOrder: 0,
    enabled: input.enabled ?? true,
    createdAt: now,
    updatedAt: now,
  });

  await bumpQuotesConfigVersion(input.streamerId);

  const rows = await listQuoteCategories(input.streamerId);
  const created = rows.items.find((item) => item.id === input.id);
  if (!created) throw new HttpError("Categoria não encontrada após criação", 500);
  return created;
}

export async function listQuotes(
  streamerId: string,
  filters: QuoteListFilters = {}
): Promise<QuotesListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const offset = (page - 1) * limit;

  const conditions = [
    eq(quotes.streamerId, streamerId),
    isNull(quotes.deletedAt),
  ];

  if (filters.status) {
    conditions.push(eq(quotes.status, filters.status));
  } else {
    conditions.push(eq(quotes.status, "active"));
  }

  if (filters.q?.trim()) {
    const normalized = normalizeQuoteSearchText(filters.q);
    conditions.push(
      or(
        like(quotes.textNormalized, `%${normalized}%`),
        like(quotes.speakerName, `%${filters.q.trim()}%`)
      )!
    );
  }

  if (filters.categoryId) {
    conditions.push(eq(quotes.categoryId, filters.categoryId));
  }

  if (filters.categorySlug) {
    const category = await db
      .select()
      .from(quoteCategories)
      .where(
        and(
          eq(quoteCategories.streamerId, streamerId),
          eq(quoteCategories.slug, slugifyQuoteText(filters.categorySlug))
        )
      )
      .limit(1);
    if (category[0]) {
      conditions.push(eq(quotes.categoryId, category[0].id));
    } else {
      return { items: [], total: 0, page, limit };
    }
  }

  if (filters.gameName?.trim()) {
    conditions.push(like(quotes.gameName, `%${filters.gameName.trim()}%`));
  }

  if (filters.speakerName?.trim()) {
    conditions.push(like(quotes.speakerName, `%${filters.speakerName.trim()}%`));
  }

  if (filters.source) {
    conditions.push(eq(quotes.source, filters.source));
  }

  if (filters.from) {
    conditions.push(gte(quotes.occurredAt, filters.from));
  }

  if (filters.to) {
    conditions.push(lte(quotes.occurredAt, filters.to));
  }

  for (const marker of filters.markers ?? []) {
    if (marker === "favorite") conditions.push(eq(quotes.isFavorite, true));
    if (marker === "iconic") conditions.push(eq(quotes.isIconic, true));
    if (marker === "historic") conditions.push(eq(quotes.isHistoric, true));
    if (marker === "channel_meme") conditions.push(eq(quotes.isChannelMeme, true));
  }

  let quoteIdsFromTag: string[] | null = null;
  if (filters.tagSlug) {
    const tag = await db
      .select()
      .from(quoteTags)
      .where(
        and(
          eq(quoteTags.streamerId, streamerId),
          eq(quoteTags.slug, slugifyQuoteText(filters.tagSlug))
        )
      )
      .limit(1);

    if (!tag[0]) return { items: [], total: 0, page, limit };

    const assignments = await db
      .select()
      .from(quoteTagAssignments)
      .where(eq(quoteTagAssignments.tagId, tag[0].id));

    quoteIdsFromTag = assignments.map((row: { quoteId: string }) => row.quoteId);
    if (quoteIdsFromTag.length === 0) return { items: [], total: 0, page, limit };
    conditions.push(inArray(quotes.id, quoteIdsFromTag));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(quotes)
      .leftJoin(quoteCategories, eq(quotes.categoryId, quoteCategories.id))
      .where(whereClause)
      .orderBy(desc(quotes.occurredAt))
      .limit(limit)
      .offset(offset),
    db.select().from(quotes).where(whereClause),
  ]);

  const quoteIds = rows.map((row) => row.quotes.id);
  const tagsByQuote = await loadTagsForQuotes(quoteIds);

  return {
    items: rows.map((row) =>
      mapQuoteRow(row.quotes, {
        categoryName: row.quote_categories?.name ?? null,
        tags: tagsByQuote.get(row.quotes.id) ?? [],
      })
    ),
    total: countResult.length,
    page,
    limit,
  };
}

export async function getQuoteById(
  streamerId: string,
  quoteId: string
): Promise<QuoteDto | null> {
  const rows = await db
    .select()
    .from(quotes)
    .leftJoin(quoteCategories, eq(quotes.categoryId, quoteCategories.id))
    .where(
      and(
        eq(quotes.streamerId, streamerId),
        eq(quotes.id, quoteId),
        isNull(quotes.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const tagsByQuote = await loadTagsForQuotes([row.quotes.id]);
  return mapQuoteRow(row.quotes, {
    categoryName: row.quote_categories?.name ?? null,
    tags: tagsByQuote.get(row.quotes.id) ?? [],
  });
}

export async function getQuoteByNumber(
  streamerId: string,
  number: number
): Promise<QuoteDto | null> {
  const rows = await db
    .select()
    .from(quotes)
    .leftJoin(quoteCategories, eq(quotes.categoryId, quoteCategories.id))
    .where(
      and(
        eq(quotes.streamerId, streamerId),
        eq(quotes.number, number),
        eq(quotes.status, "active"),
        isNull(quotes.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const tagsByQuote = await loadTagsForQuotes([row.quotes.id]);
  return mapQuoteRow(row.quotes, {
    categoryName: row.quote_categories?.name ?? null,
    tags: tagsByQuote.get(row.quotes.id) ?? [],
  });
}

export async function createQuote(input: CreateQuoteInput): Promise<QuoteDto> {
  const config = await ensureQuotesConfig(input.streamerId);
  if (!config.enabled) {
    throw new HttpError("Módulo de quotes desativado neste canal.", 403, "QUOTES_DISABLED");
  }

  const now = new Date();
  const occurredAt = input.occurredAt ?? now;
  const number = await nextQuoteNumber(input.streamerId);
  const streamContext = input.streamContext ?? {};
  const tagIds = await upsertTags(input.streamerId, input.tagSlugs);

  await db.insert(quotes).values({
    id: input.id,
    streamerId: input.streamerId,
    number,
    text: input.text.trim(),
    textNormalized: normalizeQuoteSearchText(input.text),
    speakerType: input.speakerType ?? "custom",
    speakerName: input.speakerName.trim(),
    speakerTwitchId: input.speakerTwitchId ?? null,
    registeredByUserId: input.registeredByUserId ?? null,
    registeredByUsername: input.registeredByUsername,
    registeredByRole: input.registeredByRole,
    source: input.source,
    occurredAt,
    timezone: input.timezone ?? "America/Sao_Paulo",
    platform: streamContext.platform ?? "twitch",
    streamTitle: streamContext.streamTitle ?? null,
    streamCategory: streamContext.streamCategory ?? null,
    gameName: streamContext.gameName ?? null,
    streamTags: JSON.stringify(streamContext.streamTags ?? []),
    streamStartedAt: streamContext.streamStartedAt
      ? new Date(streamContext.streamStartedAt)
      : null,
    streamElapsedSeconds: streamContext.streamElapsedSeconds ?? null,
    categoryId: input.categoryId ?? null,
    isFavorite: input.isFavorite ?? false,
    isIconic: input.isIconic ?? false,
    isHistoric: input.isHistoric ?? false,
    isChannelMeme: input.isChannelMeme ?? false,
    customFields: JSON.stringify(input.customFields ?? {}),
    internalNotes: input.internalNotes ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await assignTagsToQuote(input.id, tagIds);
  await bumpQuotesConfigVersion(input.streamerId);

  const created = await getQuoteById(input.streamerId, input.id);
  if (!created) throw new HttpError("Quote não encontrada após criação", 500);
  return created;
}

export async function createQuoteFromBot(
  streamerId: string,
  input: BotCreateQuoteInput
): Promise<QuoteDto> {
  return createQuote({
    id: createRandomString(16),
    streamerId,
    text: input.text,
    speakerName: input.speakerName?.trim() || input.displayName,
    speakerType: input.speakerType ?? "custom",
    speakerTwitchId: input.twitchUserId,
    registeredByUserId: input.twitchUserId,
    registeredByUsername: input.twitchUsername,
    registeredByRole: input.registeredByRole ?? "moderator",
    source: "chat_command",
    streamContext: input.streamContext,
  });
}

export async function updateQuote(
  streamerId: string,
  quoteId: string,
  patch: Partial<{
    text: string;
    speakerType: string;
    speakerName: string;
    occurredAt: Date;
    categoryId: string | null;
    tagSlugs: string[];
    isFavorite: boolean;
    isIconic: boolean;
    isHistoric: boolean;
    isChannelMeme: boolean;
    internalNotes: string | null;
    status: string;
    streamContext: CreateQuoteInput["streamContext"];
  }>
): Promise<QuoteDto> {
  const existing = await getQuoteById(streamerId, quoteId);
  if (!existing) throw new HttpError("Quote não encontrada", 404);

  const now = new Date();
  const streamContext = patch.streamContext;

  await db
    .update(quotes)
    .set({
      ...(patch.text !== undefined
        ? {
            text: patch.text.trim(),
            textNormalized: normalizeQuoteSearchText(patch.text),
          }
        : {}),
      ...(patch.speakerType !== undefined ? { speakerType: patch.speakerType } : {}),
      ...(patch.speakerName !== undefined ? { speakerName: patch.speakerName.trim() } : {}),
      ...(patch.occurredAt !== undefined ? { occurredAt: patch.occurredAt } : {}),
      ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
      ...(patch.isFavorite !== undefined ? { isFavorite: patch.isFavorite } : {}),
      ...(patch.isIconic !== undefined ? { isIconic: patch.isIconic } : {}),
      ...(patch.isHistoric !== undefined ? { isHistoric: patch.isHistoric } : {}),
      ...(patch.isChannelMeme !== undefined ? { isChannelMeme: patch.isChannelMeme } : {}),
      ...(patch.internalNotes !== undefined ? { internalNotes: patch.internalNotes } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(streamContext?.platform !== undefined ? { platform: streamContext.platform } : {}),
      ...(streamContext?.streamTitle !== undefined
        ? { streamTitle: streamContext.streamTitle }
        : {}),
      ...(streamContext?.streamCategory !== undefined
        ? { streamCategory: streamContext.streamCategory }
        : {}),
      ...(streamContext?.gameName !== undefined ? { gameName: streamContext.gameName } : {}),
      ...(streamContext?.streamTags !== undefined
        ? { streamTags: JSON.stringify(streamContext.streamTags) }
        : {}),
      ...(streamContext?.streamStartedAt !== undefined
        ? {
            streamStartedAt: streamContext.streamStartedAt
              ? new Date(streamContext.streamStartedAt)
              : null,
          }
        : {}),
      ...(streamContext?.streamElapsedSeconds !== undefined
        ? { streamElapsedSeconds: streamContext.streamElapsedSeconds }
        : {}),
      updatedAt: now,
    })
    .where(and(eq(quotes.id, quoteId), eq(quotes.streamerId, streamerId)));

  if (patch.tagSlugs !== undefined) {
    const tagIds = await upsertTags(streamerId, patch.tagSlugs);
    await replaceQuoteTags(quoteId, tagIds);
  }

  await bumpQuotesConfigVersion(streamerId);

  const updated = await getQuoteById(streamerId, quoteId);
  if (!updated) throw new HttpError("Quote não encontrada", 404);
  return updated;
}

export async function archiveQuote(streamerId: string, quoteId: string): Promise<QuoteDto> {
  return updateQuote(streamerId, quoteId, { status: "archived" });
}

export async function restoreQuote(streamerId: string, quoteId: string): Promise<QuoteDto> {
  return updateQuote(streamerId, quoteId, { status: "active" });
}

export async function deleteQuote(streamerId: string, quoteId: string): Promise<void> {
  const existing = await getQuoteById(streamerId, quoteId);
  if (!existing) throw new HttpError("Quote não encontrada", 404);

  await db
    .update(quotes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(quotes.id, quoteId), eq(quotes.streamerId, streamerId)));

  await bumpQuotesConfigVersion(streamerId);
}

export async function duplicateQuote(
  streamerId: string,
  quoteId: string,
  actor: { userId: string; username: string }
): Promise<QuoteDto> {
  const existing = await getQuoteById(streamerId, quoteId);
  if (!existing) throw new HttpError("Quote não encontrada", 404);

  return createQuote({
    id: createRandomString(16),
    streamerId,
    text: existing.text,
    speakerType: existing.speakerType,
    speakerName: existing.speakerName,
    speakerTwitchId: existing.speakerTwitchId,
    registeredByUserId: actor.userId,
    registeredByUsername: actor.username,
    registeredByRole: "owner",
    source: "panel",
    categoryId: existing.categoryId,
    tagSlugs: existing.tags.map((tag) => tag.slug),
    isFavorite: existing.isFavorite,
    isIconic: existing.isIconic,
    isHistoric: existing.isHistoric,
    isChannelMeme: existing.isChannelMeme,
    internalNotes: existing.internalNotes,
    customFields: existing.customFields,
    streamContext: {
      platform: existing.platform,
      streamTitle: existing.streamTitle,
      streamCategory: existing.streamCategory,
      gameName: existing.gameName,
      streamTags: existing.streamTags,
      streamStartedAt: existing.streamStartedAt,
      streamElapsedSeconds: existing.streamElapsedSeconds,
    },
  });
}

export async function incrementQuoteDisplayCount(
  streamerId: string,
  quoteId: string
): Promise<void> {
  await db
    .update(quotes)
    .set({
      displayCount: sql`${quotes.displayCount} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, quoteId), eq(quotes.streamerId, streamerId)));
}

export async function pickRandomQuote(
  streamerId: string,
  query: BotQuoteQuery = {}
): Promise<QuoteDto | null> {
  if (query.number) {
    return getQuoteByNumber(streamerId, query.number);
  }

  const conditions = [
    eq(quotes.streamerId, streamerId),
    eq(quotes.status, "active"),
    isNull(quotes.deletedAt),
  ];

  if (query.categorySlug) {
    const category = await db
      .select()
      .from(quoteCategories)
      .where(
        and(
          eq(quoteCategories.streamerId, streamerId),
          eq(quoteCategories.slug, slugifyQuoteText(query.categorySlug))
        )
      )
      .limit(1);
    if (!category[0]) return null;
    conditions.push(eq(quotes.categoryId, category[0].id));
  }

  if (query.tagSlug) {
    const tag = await db
      .select()
      .from(quoteTags)
      .where(
        and(
          eq(quoteTags.streamerId, streamerId),
          eq(quoteTags.slug, slugifyQuoteText(query.tagSlug))
        )
      )
      .limit(1);
    if (!tag[0]) return null;

    const assignments = await db
      .select()
      .from(quoteTagAssignments)
      .where(eq(quoteTagAssignments.tagId, tag[0].id));

    const ids = assignments.map((row) => row.quoteId);
    if (ids.length === 0) return null;
    conditions.push(inArray(quotes.id, ids));
  }

  if (query.gameName) {
    conditions.push(like(quotes.gameName, `%${query.gameName}%`));
  }

  const rows = await db
    .select()
    .from(quotes)
    .leftJoin(quoteCategories, eq(quotes.categoryId, quoteCategories.id))
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const tagsByQuote = await loadTagsForQuotes([row.quotes.id]);
  return mapQuoteRow(row.quotes, {
    categoryName: row.quote_categories?.name ?? null,
    tags: tagsByQuote.get(row.quotes.id) ?? [],
  });
}

export async function getQuotesDashboard(streamerId: string): Promise<QuotesDashboardDto> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allQuotes = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.streamerId, streamerId), isNull(quotes.deletedAt)));

  const activeQuotes = allQuotes.filter((row) => row.status === "active");
  const categoryIds = [
    ...new Set(activeQuotes.map((row) => row.categoryId).filter(Boolean)),
  ] as string[];

  const categoryRows =
    categoryIds.length > 0
      ? await db
          .select()
          .from(quoteCategories)
          .where(inArray(quoteCategories.id, categoryIds))
      : [];

  const categoryNames = new Map(categoryRows.map((row) => [row.id, row.name]));
  const categoryCounts = new Map<string, number>();
  const gameCounts = new Map<string, number>();

  for (const row of activeQuotes) {
    if (row.categoryId) {
      const name = categoryNames.get(row.categoryId) ?? "Sem categoria";
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
    }
    if (row.gameName?.trim()) {
      gameCounts.set(row.gameName, (gameCounts.get(row.gameName) ?? 0) + 1);
    }
  }

  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topGames = [...gameCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const mostDisplayed = [...allQuotes]
    .sort((a, b) => b.displayCount - a.displayCount)
    .slice(0, 5)
    .map((row) => ({
      number: row.number,
      text: row.text,
      displayCount: row.displayCount,
    }));

  const recentActivity = [...allQuotes]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((row) => ({
      quoteId: row.id,
      number: row.number,
      action: row.source === "chat_command" ? "criada via comando" : "registrada",
      actorUsername: row.registeredByUsername,
      occurredAt: row.createdAt,
    }));

  return {
    totalQuotes: activeQuotes.length,
    quotesThisWeek: allQuotes.filter((row) => row.createdAt >= weekAgo).length,
    totalDisplays: allQuotes.reduce((sum, row) => sum + row.displayCount, 0),
    iconicCount: activeQuotes.filter((row) => row.isIconic).length,
    topCategories,
    topGames,
    mostDisplayed,
    recentActivity,
  };
}
