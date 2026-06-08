import { NextRequest } from "next/server";
import {
  getStreamerById,
  isModeratorForStreamer,
} from "@/lib/db-queries";

export const ADMIN_ACTING_AS_COOKIE = "admin_acting_as";

export interface SessionUser {
  id: string;
  name?: string;
  twitchUsername?: string;
  avatar?: string;
}

export function parseSessionUser(request: NextRequest): SessionUser | null {
  const raw = request.cookies.get("twitch_session")?.value;
  return parseSessionFromCookie(raw);
}

export function parseSessionFromCookie(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    return parsed?.id ? parsed : null;
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as SessionUser;
      return parsed?.id ? parsed : null;
    } catch {
      return null;
    }
  }
}

export function getActingAsStreamerId(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(ADMIN_ACTING_AS_COOKIE)?.value?.trim();
  if (fromCookie) return fromCookie;
  return null;
}

/** Dono do canal ou moderador cadastrado */
export async function canManageStreamer(
  userId: string,
  targetStreamerId: string
): Promise<boolean> {
  if (!userId || !targetStreamerId) return false;
  if (userId === targetStreamerId) return true;
  return isModeratorForStreamer(userId, targetStreamerId);
}

export async function assertCanManageStreamer(
  request: NextRequest,
  targetStreamerId: string
): Promise<{ user: SessionUser } | { error: string; status: number }> {
  const user = parseSessionUser(request);
  if (!user) {
    return { error: "Não autorizado", status: 401 };
  }

  const allowed = await canManageStreamer(user.id, targetStreamerId);
  if (!allowed) {
    return { error: "Sem permissão para este canal", status: 403 };
  }

  return { user };
}

export async function resolveActingStreamerId(
  request: NextRequest,
  bodyStreamerId?: string | null
): Promise<
  | { streamerId: string; user: SessionUser }
  | { error: string; status: number }
> {
  const user = parseSessionUser(request);
  if (!user) {
    return { error: "Não autorizado", status: 401 };
  }

  const candidate =
    bodyStreamerId?.trim() ||
    getActingAsStreamerId(request) ||
    user.id;

  const streamer = await getStreamerById(candidate);
  if (!streamer) {
    return { error: "Canal não encontrado", status: 404 };
  }

  const allowed = await canManageStreamer(user.id, streamer.id);
  if (!allowed) {
    return { error: "Sem permissão para este canal", status: 403 };
  }

  return { streamerId: streamer.id, user };
}
