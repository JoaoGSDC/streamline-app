import { NextRequest, NextResponse } from "next/server";
import {
  createStreamerGame,
  getStreamerGameWithGameById,
  listStreamerGamesByStreamer,
} from "@/lib/db-queries";
import { resolveActingStreamerId } from "@/lib/admin-auth";
import {
  clampRating,
  finishedInYear,
  resolveDatesForCreate,
  type StreamerGameStatus,
} from "@/lib/streamer-game-status";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const streamerId = searchParams.get("streamerId");
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const status = searchParams.get("status");
    const finishedYear = searchParams.get("finishedYear");
    if (!streamerId) {
      return NextResponse.json({ error: "streamerId is required" }, { status: 400 });
    }
    const items = await listStreamerGamesByStreamer(streamerId);

    const yearNum = finishedYear ? parseInt(finishedYear, 10) : NaN;

    const filtered = items.filter((it: any) => {
      const okQ = q
        ? (it.game?.title || it.customTitle || "").toLowerCase().includes(q)
        : true;
      const okStatus =
        status && ["to_play", "playing", "finished", "dropped"].includes(status)
          ? it.status === status
          : true;
      const okYear =
        !finishedYear || Number.isNaN(yearNum)
          ? true
          : it.status === "to_play" ||
            it.status === "playing" ||
            finishedInYear(it, yearNum);
      return okQ && okStatus && okYear;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch streamer games" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      streamerId: bodyStreamerId,
      gameId,
      customTitle,
      customImage,
      status,
      startedAt,
      finishedAt,
      notes,
      sortOrder,
      rating,
    } = body;

    const resolved = await resolveActingStreamerId(
      request,
      bodyStreamerId ?? null
    );
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    if (!status || !["to_play", "playing", "finished", "dropped"].includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const dates = resolveDatesForCreate(status as StreamerGameStatus, {
      startedAt,
      finishedAt,
    });

    const created = await createStreamerGame({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      streamerId: resolved.streamerId,
      gameId: gameId || null,
      customTitle: customTitle || null,
      customImage: customImage || null,
      status,
      startedAt: dates.startedAt,
      finishedAt: dates.finishedAt,
      rating:
        status === "finished" || status === "dropped"
          ? clampRating(rating)
          : null,
      notes: notes || null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : null,
    });
    const item =
      (await getStreamerGameWithGameById(created.id)) ?? created;
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create streamer game" }, { status: 500 });
  }
}
