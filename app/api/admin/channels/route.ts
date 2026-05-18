import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ACTING_AS_COOKIE,
  getActingAsStreamerId,
  parseSessionUser,
  canManageStreamer,
} from "@/lib/admin-auth";
import {
  getStreamerById,
  listModeratedStreamersForUser,
} from "@/lib/db-queries";

export type AdminChannelRole = "owner" | "moderator";

export interface AdminChannelDto {
  id: string;
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  role: AdminChannelRole;
}

function toChannel(
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

async function buildChannels(user: {
  id: string;
  name?: string;
  twitchUsername?: string;
  avatar?: string;
}): Promise<AdminChannelDto[]> {
  const channels: AdminChannelDto[] = [];
  const own = await getStreamerById(user.id);

  if (own) {
    channels.push(toChannel(own, "owner"));
  } else if (user.twitchUsername) {
    channels.push({
      id: user.id,
      name: user.name ?? user.twitchUsername,
      twitchUsername: user.twitchUsername,
      avatar: user.avatar ?? null,
      role: "owner",
    });
  }

  const moderated = await listModeratedStreamersForUser(user.id);
  for (const streamer of moderated) {
    if (!channels.some((c) => c.id === streamer.id)) {
      channels.push(toChannel(streamer, "moderator"));
    }
  }

  return channels;
}

export async function GET(request: NextRequest) {
  try {
    const user = parseSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const channels = await buildChannels(user);
    if (channels.length === 0) {
      return NextResponse.json({ error: "Nenhum canal disponível" }, { status: 404 });
    }

    let actingId = getActingAsStreamerId(request) ?? user.id;
    if (!(await canManageStreamer(user.id, actingId))) {
      actingId = user.id;
    }

    const actingAs =
      channels.find((c) => c.id === actingId) ??
      channels.find((c) => c.id === user.id) ??
      channels[0];

    return NextResponse.json({ channels, actingAs, userId: user.id });
  } catch (error) {
    console.error("GET admin/channels error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar canais" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = parseSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const streamerId = String(body?.streamerId ?? "").trim();
    if (!streamerId) {
      return NextResponse.json(
        { error: "streamerId é obrigatório" },
        { status: 400 }
      );
    }

    const allowed = await canManageStreamer(user.id, streamerId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Sem permissão para este canal" },
        { status: 403 }
      );
    }

    const channels = await buildChannels(user);
    const actingAs = channels.find((c) => c.id === streamerId);
    if (!actingAs) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    const response = NextResponse.json({ actingAs });
    response.cookies.set(ADMIN_ACTING_AS_COOKIE, streamerId, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: false,
    });

    return response;
  } catch (error) {
    console.error("POST admin/channels error:", error);
    return NextResponse.json(
      { error: "Falha ao trocar canal" },
      { status: 500 }
    );
  }
}
