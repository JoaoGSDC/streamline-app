import { NextRequest } from "next/server";
import { z } from "zod";
import { assertBotServiceToken } from "@lib/bot-auth";
import { saveBotHeartbeat } from "@lib/bot-heartbeat";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

const heartbeatSchema = z.object({
  version: z.string().min(1),
  uptimeSeconds: z.number().nonnegative(),
  channels: z.array(
    z.object({
      streamerId: z.string().min(1),
      twitchUsername: z.string().min(1),
      ircStatus: z.enum(["connected", "disconnected", "degraded"]),
      configVersion: z.number().nonnegative(),
    })
  ),
  recentErrors: z.array(z.string()).default([]),
});

export async function postBotHeartbeatController(request: NextRequest) {
  try {
    if (!assertBotServiceToken(request)) {
      return jsonError("Não autorizado", 401, "UNAUTHORIZED");
    }

    const payload = heartbeatSchema.parse(await request.json());
    const stored = saveBotHeartbeat(payload);

    return jsonSuccess({
      receivedAt: stored.receivedAt.toISOString(),
      channels: stored.channels.length,
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao registrar heartbeat do bot");
  }
}
