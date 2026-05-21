import { NextRequest } from "next/server";
import {
  deleteStreamerGame,
  getStreamerGameById,
  getStreamerGameWithGameById,
  updateStreamerGame,
} from "@lib/db-queries";
import { assertCanManageStreamer } from "@lib/admin-auth";
import {
  clampRating,
  resolveDatesOnStatusChange,
  type StreamerGameStatus,
} from "@lib/streamer-game-status";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

const UPDATABLE_FIELDS = [
  "gameId",
  "customTitle",
  "customImage",
  "status",
  "startedAt",
  "finishedAt",
  "rating",
  "notes",
  "sortOrder",
] as const;

export async function updateStreamerGameController(
  request: NextRequest,
  streamerGameId: string
) {
  try {
    const existingGame = await getStreamerGameById(streamerGameId);
    if (!existingGame) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    const auth = await assertCanManageStreamer(request, existingGame.streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    const body = await request.json();
    const updatePayload: Record<string, unknown> = {};

    for (const fieldKey of UPDATABLE_FIELDS) {
      if (!(fieldKey in body)) continue;
      if (fieldKey === "startedAt" || fieldKey === "finishedAt") {
        updatePayload[fieldKey] = body[fieldKey] ? new Date(body[fieldKey]) : null;
        continue;
      }
      if (fieldKey === "rating") {
        updatePayload[fieldKey] = clampRating(body[fieldKey]);
        continue;
      }
      updatePayload[fieldKey] = body[fieldKey];
    }

    if (body.status && body.status !== existingGame.status) {
      const resolvedDates = resolveDatesOnStatusChange(
        existingGame.status as StreamerGameStatus,
        body.status as StreamerGameStatus,
        {
          startedAt: existingGame.startedAt,
          finishedAt: existingGame.finishedAt,
          rating: (existingGame as { rating?: number | null }).rating ?? null,
        },
        {
          startedAt: body.startedAt,
          finishedAt: body.finishedAt,
          rating: body.rating,
        }
      );
      updatePayload.startedAt = resolvedDates.startedAt;
      updatePayload.finishedAt = resolvedDates.finishedAt;
      updatePayload.rating = resolvedDates.rating;
    }

    const nextStatus = (body.status ?? existingGame.status) as StreamerGameStatus;
    if (nextStatus !== "finished" && nextStatus !== "dropped") {
      updatePayload.rating = null;
    } else if (!("rating" in updatePayload) && body.rating !== undefined) {
      updatePayload.rating = clampRating(body.rating);
    }

    await updateStreamerGame(streamerGameId, updatePayload);
    const enrichedGame = await getStreamerGameWithGameById(streamerGameId);
    return jsonSuccess(enrichedGame ?? { ok: true });
  } catch (error) {
    return handleRouteError(error, "Failed to update streamer game");
  }
}

export async function deleteStreamerGameController(
  request: NextRequest,
  streamerGameId: string
) {
  try {
    const existingGame = await getStreamerGameById(streamerGameId);
    if (!existingGame) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    const auth = await assertCanManageStreamer(request, existingGame.streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    await deleteStreamerGame(streamerGameId);
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Failed to delete streamer game");
  }
}
