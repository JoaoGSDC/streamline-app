import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  createBotBlacklistTerm,
  getBotBlacklistByTerm,
  listBotBlacklistTerms,
} from "@lib/bot-db-queries";
import {
  createBotBlacklistSchema,
  formatZodErrorMessages,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

export async function listBotBlacklistController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const items = await listBotBlacklistTerms(resolved.streamerId, search);
    return jsonSuccess({ items });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar blacklist");
  }
}

export async function createBotBlacklistController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = createBotBlacklistSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const duplicate = await getBotBlacklistByTerm(
      resolved.streamerId,
      parsed.data.term
    );
    if (duplicate) {
      return jsonError("Este termo já está na blacklist", 409, "CONFLICT");
    }

    const { term, configVersion } = await createBotBlacklistTerm({
      id: createRandomString(12),
      streamerId: resolved.streamerId,
      term: parsed.data.term,
      matchType: parsed.data.matchType,
      action: parsed.data.action,
      timeoutSeconds: parsed.data.timeoutSeconds ?? null,
      enabled: parsed.data.enabled ?? true,
    });

    return jsonSuccess({ ...term, configVersion }, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao adicionar termo");
  }
}
