import { NextRequest } from "next/server";
import { resolveActiveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  createBotCommand,
  getBotCommandByTrigger,
  listBotCommands,
} from "@lib/bot-db-queries";
import {
  createBotCommandSchema,
  formatZodErrorMessages,
} from "@server/bot/bot.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

export async function listBotCommandsController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const result = await listBotCommands(resolved.streamerId, {
      search,
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 50 : limit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar comandos");
  }
}

export async function createBotCommandController(request: NextRequest) {
  try {
    const resolved = await resolveActiveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const body = await request.json();
    const parsed = createBotCommandSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        formatZodErrorMessages(parsed.error),
        400,
        "VALIDATION_ERROR"
      );
    }

    const duplicate = await getBotCommandByTrigger(
      resolved.streamerId,
      parsed.data.trigger
    );
    if (duplicate) {
      return jsonError("Já existe um comando com este trigger", 409, "CONFLICT");
    }

    const { command, configVersion } = await createBotCommand({
      id: createRandomString(12),
      streamerId: resolved.streamerId,
      trigger: parsed.data.trigger,
      response: parsed.data.response,
      cooldownSeconds: parsed.data.cooldownSeconds ?? 0,
      enabled: parsed.data.enabled ?? true,
    });

    return jsonSuccess({ ...command, configVersion }, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar comando");
  }
}
