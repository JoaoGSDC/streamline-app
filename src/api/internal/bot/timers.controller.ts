import { NextRequest } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";
import { createBotTimer, listBotTimers } from "@lib/bot-db-queries";
import {
  createBotTimerSchema,
  formatZodErrorMessages,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

export async function listBotTimersController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const items = await listBotTimers(resolved.streamerId);
    return jsonSuccess({ items });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar timers");
  }
}

export async function createBotTimerController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = createBotTimerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const { timer, configVersion } = await createBotTimer({
      id: createRandomString(12),
      streamerId: resolved.streamerId,
      name: parsed.data.name ?? null,
      intervalMinutes: parsed.data.intervalMinutes,
      message: parsed.data.message,
      enabled: parsed.data.enabled ?? true,
    });

    return jsonSuccess({ ...timer, configVersion }, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar timer");
  }
}
