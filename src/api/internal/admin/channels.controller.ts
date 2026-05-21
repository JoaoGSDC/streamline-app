import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ACTING_AS_COOKIE,
  getActingAsStreamerId,
  parseSessionUser,
  canManageStreamer,
} from "@lib/admin-auth";
import {
  getStreamerById,
  listModeratedStreamersForUser,
} from "@lib/db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export type AdminChannelRole = "owner" | "moderator";

export interface AdminChannelDto {
  id: string;
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  role: AdminChannelRole;
}

function toAdminChannel(
  streamer: {
    id: string;
    name: string;
    twitchUsername: string;
    avatar?: string | null;
  },
  role: AdminChannelRole
): AdminChannelDto {
  return {
    id: streamer.id,
    name: streamer.name,
    twitchUsername: streamer.twitchUsername,
    avatar: streamer.avatar ?? null,
    role,
  };
}

async function buildAdminChannels(sessionUser: {
  id: string;
  name?: string;
  twitchUsername?: string;
  avatar?: string;
}): Promise<AdminChannelDto[]> {
  const channels: AdminChannelDto[] = [];
  const ownedStreamer = await getStreamerById(sessionUser.id);

  if (ownedStreamer) {
    channels.push(toAdminChannel(ownedStreamer, "owner"));
  } else if (sessionUser.twitchUsername) {
    channels.push({
      id: sessionUser.id,
      name: sessionUser.name ?? sessionUser.twitchUsername,
      twitchUsername: sessionUser.twitchUsername,
      avatar: sessionUser.avatar ?? null,
      role: "owner",
    });
  }

  const moderatedStreamers = await listModeratedStreamersForUser(sessionUser.id);
  for (const moderatedStreamer of moderatedStreamers) {
    if (!channels.some((channel) => channel.id === moderatedStreamer.id)) {
      channels.push(toAdminChannel(moderatedStreamer, "moderator"));
    }
  }

  return channels;
}

export async function listAdminChannelsController(request: NextRequest) {
  try {
    const sessionUser = parseSessionUser(request);
    if (!sessionUser) {
      return jsonError("Não autorizado", 401);
    }

    const channels = await buildAdminChannels(sessionUser);
    if (channels.length === 0) {
      return jsonError("Nenhum canal disponível", 404);
    }

    let actingStreamerId = getActingAsStreamerId(request) ?? sessionUser.id;
    if (!(await canManageStreamer(sessionUser.id, actingStreamerId))) {
      actingStreamerId = sessionUser.id;
    }

    const actingAs =
      channels.find((channel) => channel.id === actingStreamerId) ??
      channels.find((channel) => channel.id === sessionUser.id) ??
      channels[0];

    return jsonSuccess({
      channels,
      actingAs,
      userId: sessionUser.id,
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar canais");
  }
}

export async function switchAdminChannelController(request: NextRequest) {
  try {
    const sessionUser = parseSessionUser(request);
    if (!sessionUser) {
      return jsonError("Não autorizado", 401);
    }

    const body = await request.json();
    const streamerId = String(body?.streamerId ?? "").trim();
    if (!streamerId) {
      return jsonError("streamerId é obrigatório", 400, "VALIDATION_ERROR");
    }

    const isAllowed = await canManageStreamer(sessionUser.id, streamerId);
    if (!isAllowed) {
      return jsonError("Sem permissão para este canal", 403);
    }

    const channels = await buildAdminChannels(sessionUser);
    const actingAs = channels.find((channel) => channel.id === streamerId);
    if (!actingAs) {
      return jsonError("Canal não encontrado", 404, "NOT_FOUND");
    }

    const response = jsonSuccess({ actingAs });
    response.cookies.set(ADMIN_ACTING_AS_COOKIE, streamerId, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return handleRouteError(error, "Falha ao trocar canal");
  }
}
