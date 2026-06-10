import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import {
  createQuoteFromBot,
  getQuoteByNumber,
  getQuotesConfig,
  incrementQuoteDisplayCount,
  pickRandomQuote,
} from "@lib/quotes-db-queries";
import {
  botCreateQuoteSchema,
  formatQuotesZodError,
  slugifyQuoteText,
} from "@server/quotes/quotes.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

function assertM2M(request: NextRequest) {
  if (!assertBotServiceToken(request)) {
    return jsonError("Não autorizado", 401, "UNAUTHORIZED");
  }
  return null;
}

export async function getQuotesInternalConfigController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const config = await getQuotesConfig(streamerId);
    return jsonSuccess(config, 200, {
      "X-Quotes-Config-Version": String(config.configVersion),
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar config de quotes");
  }
}

export async function postQuotesInternalCreateController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = botCreateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatQuotesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const quote = await createQuoteFromBot(streamerId, parsed.data);
    return jsonSuccess(quote, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar quote via bot");
  }
}

export async function getQuotesInternalRandomController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q")?.trim();
    const categorySlug = searchParams.get("category") ?? undefined;
    const tagSlug = searchParams.get("tag") ?? undefined;
    const gameName = searchParams.get("game") ?? undefined;

    let number: number | undefined;
    let resolvedCategory = categorySlug;
    let resolvedTag = tagSlug;
    let resolvedGame = gameName;

    if (rawQuery) {
      if (/^\d+$/.test(rawQuery)) {
        number = Number(rawQuery);
      } else {
        const slug = slugifyQuoteText(rawQuery);
        resolvedCategory = resolvedCategory ?? slug;
        resolvedTag = resolvedTag ?? slug;
        resolvedGame = resolvedGame ?? rawQuery;
      }
    }

    const quote = await pickRandomQuote(streamerId, {
      number,
      categorySlug: resolvedCategory,
      tagSlug: resolvedTag,
      gameName: resolvedGame,
    });

    if (!quote) {
      return jsonError("Nenhuma quote encontrada", 404, "QUOTE_NOT_FOUND");
    }

    return jsonSuccess(quote);
  } catch (error) {
    return handleRouteError(error, "Falha ao buscar quote");
  }
}

export async function getQuotesInternalByNumberController(
  request: NextRequest,
  streamerId: string,
  number: number
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const quote = await getQuoteByNumber(streamerId, number);
    if (!quote) {
      return jsonError("Quote não encontrada", 404, "QUOTE_NOT_FOUND");
    }

    return jsonSuccess(quote);
  } catch (error) {
    return handleRouteError(error, "Falha ao buscar quote");
  }
}

export async function postQuotesInternalDisplayedController(
  request: NextRequest,
  streamerId: string,
  quoteId: string
) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    await incrementQuoteDisplayCount(streamerId, quoteId);
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Falha ao registrar exibição");
  }
}
