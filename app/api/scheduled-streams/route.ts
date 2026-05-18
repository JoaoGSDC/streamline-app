import { NextRequest, NextResponse } from "next/server";
import {
  createScheduledStream,
  getScheduledStreamsByStreamer,
} from "@/lib/db-queries";
import { resolveActingStreamerId } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      streamerId: bodyStreamerId,
      gameId,
      igdbGameId,
      gameTitle,
      gameImage,
      gameSynopsis,
      scheduledDate,
      scheduledTime,
      duration,
      links,
      notes,
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

    if (!scheduledTime || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const stream = await createScheduledStream({
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      streamerId: resolved.streamerId,
      gameId: gameId || null,
      igdbGameId: igdbGameId ?? null,
      gameTitle: gameTitle ?? null,
      gameImage: gameImage ?? null,
      gameSynopsis: gameSynopsis ?? null,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration,
      links,
      notes,
    });

    return NextResponse.json(stream);
  } catch (error) {
    console.error("Error creating scheduled stream:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled stream" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const streamerId = searchParams.get("streamerId");

    if (!streamerId) {
      return NextResponse.json(
        { error: "streamerId is required" },
        { status: 400 }
      );
    }

    const streams = await getScheduledStreamsByStreamer(streamerId);
    return NextResponse.json(streams);
  } catch (error) {
    console.error("Error fetching scheduled streams:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled streams" },
      { status: 500 }
    );
  }
}
