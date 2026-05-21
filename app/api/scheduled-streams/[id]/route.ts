import { NextRequest, NextResponse } from "next/server";
import {
  deleteScheduledStream,
  getScheduledStreamById,
  updateScheduledStream,
} from "@/lib/db-queries";
import { assertCanManageStreamer } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const stream = await getScheduledStreamById(id);
    if (!stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await assertCanManageStreamer(request, stream.streamerId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const allowed = [
      "streamerId",
      "gameId",
      "igdbGameId",
      "gameTitle",
      "gameImage",
      "gameSynopsis",
      "scheduledDate",
      "scheduledTime",
      "duration",
      "links",
      "notes",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (!(key in body)) continue;
      if (key === "scheduledDate") {
        data[key] = new Date(body[key]);
      } else {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    if (
      typeof data.streamerId === "string" &&
      data.streamerId !== stream.streamerId
    ) {
      const targetAuth = await assertCanManageStreamer(
        request,
        data.streamerId
      );
      if ("error" in targetAuth) {
        return NextResponse.json(
          { error: targetAuth.error },
          { status: targetAuth.status }
        );
      }
    }

    if (data.scheduledTime !== undefined && !data.scheduledTime) {
      return NextResponse.json(
        { error: "Horário é obrigatório" },
        { status: 400 }
      );
    }

    const updated = await updateScheduledStream(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating scheduled stream:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled stream" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const stream = await getScheduledStreamById(id);
    if (!stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await assertCanManageStreamer(request, stream.streamerId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await deleteScheduledStream(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled stream:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled stream" },
      { status: 500 }
    );
  }
}
