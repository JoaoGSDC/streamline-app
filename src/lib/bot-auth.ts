import { NextRequest } from "next/server";
import {
  parseSessionUser,
  resolveActingStreamerId,
  type SessionUser,
} from "@lib/admin-auth";
import { isBotChannelActive } from "@lib/bot-db-queries";

export const BOT_ACCESS_OWNER_ONLY = "BOT_ACCESS_OWNER_ONLY";
export const BOT_CHANNEL_NOT_ACTIVE = "BOT_CHANNEL_NOT_ACTIVE";

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

export async function resolveActiveBotOwnerStreamerId(
  request: NextRequest,
  bodyStreamerId?: string | null
): Promise<
  | { streamerId: string; user: SessionUser }
  | { error: string; status: number; code?: string }
> {
  const resolved = await resolveBotOwnerStreamerId(request, bodyStreamerId);
  if ("error" in resolved) {
    return resolved;
  }

  const active = await isBotChannelActive(resolved.streamerId);
  if (!active) {
    return {
      error: "Ative o bot no seu canal antes de usar esta funcionalidade.",
      status: 403,
      code: BOT_CHANNEL_NOT_ACTIVE,
    };
  }

  return resolved;
}

/** Dono do canal ou moderador — nunca usa streamerId do body. */
export async function resolveActiveBotChannelManager(
  request: NextRequest
): Promise<
  | { streamerId: string; user: SessionUser }
  | { error: string; status: number; code?: string }
> {
  const resolved = await resolveActingStreamerId(request);
  if ("error" in resolved) {
    return resolved;
  }

  const active = await isBotChannelActive(resolved.streamerId);
  if (!active) {
    return {
      error: "Ative o bot no seu canal antes de usar esta funcionalidade.",
      status: 403,
      code: BOT_CHANNEL_NOT_ACTIVE,
    };
  }

  return resolved;
}

export function getTwitchBotUsername(): string {
  return (
    process.env.TWITCH_BOT_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TWITCH_BOT_USERNAME?.trim() ||
    "streaminhubbot"
  );
}

export function assertBotServiceToken(request: NextRequest): boolean {
  const expected = process.env.BOT_SERVICE_TOKEN?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;

  return auth.slice(7).trim() === expected;
}
