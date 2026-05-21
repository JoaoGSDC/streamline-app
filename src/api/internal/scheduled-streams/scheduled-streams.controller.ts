import { NextRequest } from "next/server";
import {
  createScheduledStream,
  getScheduledStreamsByStreamer,
} from "@lib/db-queries";
import { resolveActingStreamerId } from "@lib/admin-auth";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export async function listScheduledStreamsController(request: NextRequest) {
  try {
    const streamerId = request.nextUrl.searchParams.get("streamerId");
    if (!streamerId) {
      return jsonError("streamerId is required", 400, "VALIDATION_ERROR");
    }

    const streams = await getScheduledStreamsByStreamer(streamerId);
    return jsonSuccess(streams);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch scheduled streams");
  }
}

export async function createScheduledStreamController(request: NextRequest) {
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
      return jsonError(resolved.error, resolved.status);
    }

    if (!scheduledTime || !duration) {
      return jsonError("Missing required fields", 400, "VALIDATION_ERROR");
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

    return jsonSuccess(stream, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create scheduled stream");
  }
}
