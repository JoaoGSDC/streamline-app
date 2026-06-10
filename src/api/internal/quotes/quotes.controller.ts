import { NextRequest } from "next/server";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  archiveQuote,
  createQuote,
  createQuoteCategory,
  deleteQuote,
  duplicateQuote,
  getQuoteById,
  getQuotesConfig,
  getQuotesDashboard,
  listQuoteCategories,
  listQuotes,
  restoreQuote,
  updateQuote,
  updateQuotesConfig,
} from "@lib/quotes-db-queries";
import {
  createQuoteCategorySchema,
  createQuoteSchema,
  formatQuotesZodError,
  updateQuoteSchema,
  updateQuotesConfigSchema,
} from "@server/quotes/quotes.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

async function resolveQuotesManager(request: NextRequest, bodyStreamerId?: string | null) {
  return resolveActingStreamerId(request, bodyStreamerId);
}

function actorFromUser(user: { id: string; twitchUsername?: string; name?: string }) {
  return {
    userId: user.id,
    username: user.twitchUsername ?? user.name ?? user.id,
  };
}

export async function getQuotesDashboardController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const dashboard = await getQuotesDashboard(resolved.streamerId);
    return jsonSuccess(dashboard);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar dashboard de quotes");
  }
}

export async function getQuotesConfigController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const config = await getQuotesConfig(resolved.streamerId);
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar configurações de quotes");
  }
}

export async function patchQuotesConfigController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateQuotesConfigSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatQuotesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const config = await updateQuotesConfig(resolved.streamerId, parsed.data);
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar configurações de quotes");
  }
}

export async function listQuotesController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const { searchParams } = new URL(request.url);
    const markers = searchParams.get("markers")?.split(",").filter(Boolean) as
      | Array<"favorite" | "iconic" | "historic" | "channel_meme">
      | undefined;

    const result = await listQuotes(resolved.streamerId, {
      q: searchParams.get("q") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      categorySlug: searchParams.get("categorySlug") ?? undefined,
      tagSlug: searchParams.get("tagSlug") ?? undefined,
      gameName: searchParams.get("gameName") ?? undefined,
      speakerName: searchParams.get("speakerName") ?? undefined,
      source: (searchParams.get("source") as never) ?? undefined,
      status: (searchParams.get("status") as "active" | "archived") ?? undefined,
      from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
      markers,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar quotes");
  }
}

export async function getQuoteController(request: NextRequest, quoteId: string) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const quote = await getQuoteById(resolved.streamerId, quoteId);
    if (!quote) return jsonError("Quote não encontrada", 404);
    return jsonSuccess(quote);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar quote");
  }
}

export async function createQuoteController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = createQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatQuotesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const actor = actorFromUser(resolved.user);
    const quote = await createQuote({
      id: createRandomString(16),
      streamerId: resolved.streamerId,
      text: parsed.data.text,
      speakerType: parsed.data.speakerType,
      speakerName: parsed.data.speakerName,
      speakerTwitchId: parsed.data.speakerTwitchId,
      registeredByUserId: actor.userId,
      registeredByUsername: actor.username,
      registeredByRole: resolved.user.id === resolved.streamerId ? "owner" : "moderator",
      source: "panel",
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      timezone: parsed.data.timezone,
      streamContext: parsed.data.streamContext,
      categoryId: parsed.data.categoryId,
      tagSlugs: parsed.data.tagSlugs,
      isFavorite: parsed.data.markers?.isFavorite,
      isIconic: parsed.data.markers?.isIconic,
      isHistoric: parsed.data.markers?.isHistoric,
      isChannelMeme: parsed.data.markers?.isChannelMeme,
      internalNotes: parsed.data.internalNotes,
      customFields: parsed.data.customFields,
    });

    return jsonSuccess(quote, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar quote");
  }
}

export async function patchQuoteController(request: NextRequest, quoteId: string) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatQuotesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const quote = await updateQuote(resolved.streamerId, quoteId, {
      text: parsed.data.text,
      speakerType: parsed.data.speakerType,
      speakerName: parsed.data.speakerName,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      categoryId: parsed.data.categoryId,
      tagSlugs: parsed.data.tagSlugs,
      isFavorite: parsed.data.markers?.isFavorite,
      isIconic: parsed.data.markers?.isIconic,
      isHistoric: parsed.data.markers?.isHistoric,
      isChannelMeme: parsed.data.markers?.isChannelMeme,
      internalNotes: parsed.data.internalNotes,
      status: parsed.data.status,
      streamContext: parsed.data.streamContext,
    });

    return jsonSuccess(quote);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar quote");
  }
}

export async function archiveQuoteController(request: NextRequest, quoteId: string) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const quote = await archiveQuote(resolved.streamerId, quoteId);
    return jsonSuccess(quote);
  } catch (error) {
    return handleRouteError(error, "Falha ao arquivar quote");
  }
}

export async function restoreQuoteController(request: NextRequest, quoteId: string) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const quote = await restoreQuote(resolved.streamerId, quoteId);
    return jsonSuccess(quote);
  } catch (error) {
    return handleRouteError(error, "Falha ao restaurar quote");
  }
}

export async function deleteQuoteController(request: NextRequest, quoteId: string) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await deleteQuote(resolved.streamerId, quoteId);
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Falha ao excluir quote");
  }
}

export async function duplicateQuoteController(request: NextRequest, quoteId: string) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const actor = actorFromUser(resolved.user);
    const quote = await duplicateQuote(resolved.streamerId, quoteId, actor);
    return jsonSuccess(quote, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao duplicar quote");
  }
}

export async function listQuoteCategoriesController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const result = await listQuoteCategories(resolved.streamerId);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar categorias");
  }
}

export async function createQuoteCategoryController(request: NextRequest) {
  try {
    const resolved = await resolveQuotesManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = createQuoteCategorySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatQuotesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const category = await createQuoteCategory({
      id: createRandomString(12),
      streamerId: resolved.streamerId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      color: parsed.data.color,
      enabled: parsed.data.enabled,
    });

    return jsonSuccess(category, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar categoria");
  }
}
