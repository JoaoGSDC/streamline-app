import { NextRequest } from "next/server";
import { assertBotServiceToken } from "@lib/bot-auth";
import {
  addRaffleChatMessage,
  getRaffleById,
} from "@lib/raffles-db-queries";
import {
  botRaffleEntrySchema,
  botRaffleMessageSchema,
  formatRafflesZodError,
} from "@server/raffles/raffles.validators";
import { processBotRaffleEntry } from "@server/raffles/raffle-service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

function assertM2M(request: NextRequest) {
  if (!assertBotServiceToken(request)) {
    return jsonError("Não autorizado", 401, "UNAUTHORIZED");
  }
  return null;
}

export async function botRaffleEntryController(request: NextRequest) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = botRaffleEntrySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatRafflesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const result = await processBotRaffleEntry(parsed.data);
    const status = result.accepted ? 200 : 409;
    return jsonSuccess(result, status);
  } catch (error) {
    return handleRouteError(error, "Falha ao registrar entrada no sorteio");
  }
}

export async function botRaffleMessageController(request: NextRequest) {
  try {
    const authError = assertM2M(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = botRaffleMessageSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatRafflesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const raffle = await getRaffleById(parsed.data.raffleId);
    if (!raffle || raffle.channelId !== parsed.data.channelId) {
      return jsonError("Sorteio não encontrado", 404, "NOT_FOUND");
    }

    const message = await addRaffleChatMessage({
      raffleId: parsed.data.raffleId,
      twitchUserId: parsed.data.twitchUserId,
      twitchLogin: parsed.data.twitchLogin,
      displayName: parsed.data.displayName,
      message: parsed.data.message,
      messageType: parsed.data.messageType,
    });

    return jsonSuccess({ stored: true, message });
  } catch (error) {
    return handleRouteError(error, "Falha ao armazenar mensagem do sorteio");
  }
}
