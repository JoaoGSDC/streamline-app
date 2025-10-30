import { NextRequest, NextResponse } from "next/server";
import { deleteStreamerGame, updateStreamerGame } from "@/lib/db-queries";

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const { params } = context as { params: { id: string } };
    const id = params.id;
    const body = await request.json();
    const allowed = ["gameId", "customTitle", "customImage", "status", "startedAt", "finishedAt", "notes", "sortOrder"];
    const data: any = {};
    for (const key of allowed) {
      if (key in body) {
        if ((key === "startedAt" || key === "finishedAt") && body[key]) {
          data[key] = new Date(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }
    await updateStreamerGame(id, data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update streamer game" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: any
) {
  try {
    const { params } = context as { params: { id: string } };
    const id = params.id;
    await deleteStreamerGame(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete streamer game" }, { status: 500 });
  }
}
