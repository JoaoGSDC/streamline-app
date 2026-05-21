import { NextRequest } from "next/server";
import {
  parseSessionUser,
  resolveActingStreamerId,
  type SessionUser,
} from "@lib/admin-auth";

export const BOT_ACCESS_OWNER_ONLY = "BOT_ACCESS_OWNER_ONLY";

export async function resolveBotOwnerStreamerId(
  request: NextRequest,
  bodyStreamerId?: string | null
): Promise<
  | { streamerId: string; user: SessionUser }
  | { error: string; status: number; code?: string }
> {
  const resolved = await resolveActingStreamerId(request, bodyStreamerId);
  if ("error" in resolved) {
    return resolved;
  }

  if (resolved.user.id !== resolved.streamerId) {
    return {
      error: "Apenas o dono do canal pode configurar o bot.",
      status: 403,
      code: BOT_ACCESS_OWNER_ONLY,
    };
  }

  return { streamerId: resolved.streamerId, user: resolved.user };
}

export function assertBotServiceToken(request: NextRequest): boolean {
  const expected = process.env.BOT_SERVICE_TOKEN?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;

  return auth.slice(7).trim() === expected;
}
