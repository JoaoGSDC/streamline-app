import { NextRequest } from "next/server";
import {
  createStreamerGame,
  getStreamerGameWithGameById,
  listStreamerGamesByStreamer,
} from "@lib/db-queries";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  clampRating,
  finishedInYear,
  resolveDatesForCreate,
  type StreamerGameStatus,
} from "@lib/streamer-game-status";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

interface StreamerGameListItem {
  status: string;
  game?: { title?: string } | null;
  customTitle?: string | null;
  finishedAt?: Date | string | null;
}

export async function listStreamerGamesController(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const streamerId = searchParams.get("streamerId");
    const searchQuery = (searchParams.get("q") || "").toLowerCase().trim();
    const statusFilter = searchParams.get("status");
    const finishedYearParam = searchParams.get("finishedYear");

    if (!streamerId) {
      return jsonError("streamerId is required", 400, "VALIDATION_ERROR");
    }

    const streamerGames = await listStreamerGamesByStreamer(streamerId);
    const finishedYear = finishedYearParam ? parseInt(finishedYearParam, 10) : NaN;

    const filteredGames = streamerGames.filter((listItem: StreamerGameListItem) => {
      const title = (listItem.game?.title || listItem.customTitle || "").toLowerCase();
      const matchesQuery = searchQuery ? title.includes(searchQuery) : true;

      const validStatuses = ["to_play", "playing", "finished", "dropped"];
      const matchesStatus =
        statusFilter && validStatuses.includes(statusFilter)
          ? listItem.status === statusFilter
          : true;

      const matchesYear =
        !finishedYearParam || Number.isNaN(finishedYear)
          ? true
          : listItem.status === "to_play" ||
            listItem.status === "playing" ||
            finishedInYear(listItem, finishedYear);

      return matchesQuery && matchesStatus && matchesYear;
    });

    return jsonSuccess(filteredGames);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch streamer games");
  }
}

export async function createStreamerGameController(request: NextRequest) {
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
      return jsonError(resolved.error, resolved.status);
    }

    const validStatuses = ["to_play", "playing", "finished", "dropped"];
    if (!status || !validStatuses.includes(status)) {
      return jsonError("invalid status", 400, "VALIDATION_ERROR");
    }

    const dates = resolveDatesForCreate(status as StreamerGameStatus, {
      startedAt,
      finishedAt,
    });

    const createdGame = await createStreamerGame({
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

    const enrichedGame =
      (await getStreamerGameWithGameById(createdGame.id)) ?? createdGame;
    return jsonSuccess(enrichedGame, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create streamer game");
  }
}
