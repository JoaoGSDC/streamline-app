import { NextRequest } from "next/server";
import {
  deleteScheduledStream,
  getScheduledStreamById,
  updateScheduledStream,
} from "@lib/db-queries";
import { assertCanManageStreamer } from "@lib/admin-auth";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

const UPDATABLE_FIELDS = [
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

function buildUpdatePayload(body: Record<string, unknown>): Record<string, unknown> {
  const updatePayload: Record<string, unknown> = {};

  for (const fieldKey of UPDATABLE_FIELDS) {
    if (!(fieldKey in body)) continue;
    if (fieldKey === "scheduledDate") {
      updatePayload[fieldKey] = new Date(body[fieldKey] as string);
      continue;
    }
    updatePayload[fieldKey] = body[fieldKey];
  }

  return updatePayload;
}

export async function updateScheduledStreamController(
  request: NextRequest,
  streamId: string
) {
  try {
    const existingStream = await getScheduledStreamById(streamId);
    if (!existingStream) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    const auth = await assertCanManageStreamer(request, existingStream.streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    const body = await request.json();
    const updatePayload = buildUpdatePayload(body);

    if (Object.keys(updatePayload).length === 0) {
      return jsonError("Nenhum campo para atualizar", 400, "VALIDATION_ERROR");
    }

    if (
      typeof updatePayload.streamerId === "string" &&
      updatePayload.streamerId !== existingStream.streamerId
    ) {
      const targetAuth = await assertCanManageStreamer(
        request,
        updatePayload.streamerId
      );
      if ("error" in targetAuth) {
        return jsonError(targetAuth.error, targetAuth.status);
      }
    }

    if (updatePayload.scheduledTime !== undefined && !updatePayload.scheduledTime) {
      return jsonError("Horário é obrigatório", 400, "VALIDATION_ERROR");
    }

    const updatedStream = await updateScheduledStream(streamId, updatePayload);
    return jsonSuccess(updatedStream);
  } catch (error) {
    return handleRouteError(error, "Failed to update scheduled stream");
  }
}

export async function deleteScheduledStreamController(
  request: NextRequest,
  streamId: string
) {
  try {
    const existingStream = await getScheduledStreamById(streamId);
    if (!existingStream) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    const auth = await assertCanManageStreamer(request, existingStream.streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    await deleteScheduledStream(streamId);
    return jsonSuccess({ success: true });
  } catch (error) {
    return handleRouteError(error, "Failed to delete scheduled stream");
  }
}
