import { NextRequest, NextResponse } from "next/server";
import { createStreamerGame, listStreamerGamesByStreamer } from "@/lib/db-queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const streamerId = searchParams.get("streamerId");
    if (!streamerId) {
      return NextResponse.json({ error: "streamerId is required" }, { status: 400 });
    }
    const items = await listStreamerGamesByStreamer(streamerId);
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch streamer games" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamerId, gameId, customTitle, customImage, status, startedAt, finishedAt, notes, sortOrder } = body;
    if (!streamerId) return NextResponse.json({ error: "streamerId is required" }, { status: 400 });
    if (!status || !["to_play", "playing", "finished"].includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    const item = await createStreamerGame({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      streamerId,
      gameId: gameId || null,
      customTitle: customTitle || null,
      customImage: customImage || null,
      status,
      startedAt: startedAt ? new Date(startedAt) : null,
      finishedAt: finishedAt ? new Date(finishedAt) : null,
      notes: notes || null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : null,
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create streamer game" }, { status: 500 });
  }
}
