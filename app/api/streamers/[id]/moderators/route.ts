import { NextRequest, NextResponse } from "next/server";
import {
  addStreamerModerator,
  getModeratorAssignment,
  getStreamerById,
  listModeratorsForStreamer,
  removeStreamerModerator,
} from "@/lib/db-queries";
import { assertCanManageStreamer, parseSessionUser } from "@/lib/admin-auth";
import { getTwitchUserByLogin } from "@/lib/twitch-api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streamerId } = await context.params;
    const user = parseSessionUser(request);
    if (!user || user.id !== streamerId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const moderators = await listModeratorsForStreamer(streamerId);
    return NextResponse.json({
      moderators: moderators.map((m) => ({
        id: m.id,
        moderatorId: m.moderatorId,
        moderatorUsername: m.moderatorUsername,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET moderators error:", error);
    return NextResponse.json(
      { error: "Falha ao listar moderadores" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streamerId } = await context.params;
    const user = parseSessionUser(request);
    if (!user || user.id !== streamerId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const username = String(body?.username ?? "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (!username) {
      return NextResponse.json(
        { error: "Informe o usuário Twitch do moderador" },
        { status: 400 }
      );
    }

    if (username === user.twitchUsername?.toLowerCase()) {
      return NextResponse.json(
        { error: "Você não pode adicionar a si mesmo como moderador" },
        { status: 400 }
      );
    }

    const streamer = await getStreamerById(streamerId);
    if (!streamer) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    const twitchUser = await getTwitchUserByLogin(username);
    if (!twitchUser) {
      return NextResponse.json(
        { error: "Usuário Twitch não encontrado" },
        { status: 404 }
      );
    }

    if (twitchUser.id === streamerId) {
      return NextResponse.json(
        { error: "O dono do canal não pode ser moderador" },
        { status: 400 }
      );
    }

    const existing = await getModeratorAssignment(streamerId, twitchUser.id);
    if (existing) {
      return NextResponse.json(
        { error: "Este usuário já é moderador" },
        { status: 409 }
      );
    }

    const row = await addStreamerModerator({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      streamerId,
      moderatorId: twitchUser.id,
      moderatorUsername: twitchUser.login,
    });

    return NextResponse.json({
      moderator: {
        id: row.id,
        moderatorId: row.moderatorId,
        moderatorUsername: row.moderatorUsername,
        createdAt: row.createdAt,
      },
    });
  } catch (error) {
    console.error("POST moderators error:", error);
    return NextResponse.json(
      { error: "Falha ao adicionar moderador" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streamerId } = await context.params;
    const auth = await assertCanManageStreamer(request, streamerId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user.id !== streamerId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const moderatorId = request.nextUrl.searchParams.get("moderatorId")?.trim();

    if (!moderatorId) {
      return NextResponse.json(
        { error: "moderatorId é obrigatório" },
        { status: 400 }
      );
    }

    await removeStreamerModerator(streamerId, moderatorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE moderators error:", error);
    return NextResponse.json(
      { error: "Falha ao remover moderador" },
      { status: 500 }
    );
  }
}
