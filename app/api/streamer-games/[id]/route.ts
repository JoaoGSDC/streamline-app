import { NextRequest, NextResponse } from "next/server";
import {
  deleteStreamerGame,
  getStreamerGameById,
  getStreamerGameWithGameById,
  updateStreamerGame,
} from "@/lib/db-queries";
import { assertCanManageStreamer } from "@/lib/admin-auth";
import {
  clampRating,
  resolveDatesOnStatusChange,
  type StreamerGameStatus,
} from "@/lib/streamer-game-status";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await getStreamerGameById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await assertCanManageStreamer(request, existing.streamerId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const body = await request.json();
    const allowed = [
      "gameId",
      "customTitle",
      "customImage",
      "status",
      "startedAt",
      "finishedAt",
      "rating",
      "notes",
      "sortOrder",
    ];
    const data: Record<string, unknown> = {};

    for (const key of allowed) {
      if (!(key in body)) continue;
      if (key === "startedAt" || key === "finishedAt") {
        data[key] = body[key] ? new Date(body[key]) : null;
      } else if (key === "rating") {
        data[key] = clampRating(body[key]);
      } else {
        data[key] = body[key];
      }
    }

    if (body.status && body.status !== existing.status) {
      const dates = resolveDatesOnStatusChange(
        existing.status as StreamerGameStatus,
        body.status as StreamerGameStatus,
        {
          startedAt: existing.startedAt,
          finishedAt: existing.finishedAt,
          rating: (existing as { rating?: number | null }).rating ?? null,
        },
        {
          startedAt: body.startedAt,
          finishedAt: body.finishedAt,
          rating: body.rating,
        }
      );
      data.startedAt = dates.startedAt;
      data.finishedAt = dates.finishedAt;
      data.rating = dates.rating;
    }

    const nextStatus = (body.status ?? existing.status) as StreamerGameStatus;
    if (nextStatus !== "finished" && nextStatus !== "dropped") {
      data.rating = null;
    } else if (!("rating" in data) && body.rating !== undefined) {
      data.rating = clampRating(body.rating);
    }

    await updateStreamerGame(id, data);
    const item = await getStreamerGameWithGameById(id);
    return NextResponse.json(item ?? { ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update streamer game" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await getStreamerGameById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await assertCanManageStreamer(request, existing.streamerId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await deleteStreamerGame(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete streamer game" }, { status: 500 });
  }
}
