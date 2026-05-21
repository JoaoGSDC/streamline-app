import { NextRequest } from "next/server";
import {
  addStreamerModerator,
  getModeratorAssignment,
  getStreamerById,
  listModeratorsForStreamer,
  removeStreamerModerator,
} from "@lib/db-queries";
import { assertCanManageStreamer, parseSessionUser } from "@lib/admin-auth";
import { twitchServerService } from "@server/twitch/twitch.service";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

export interface ModeratorDto {
  id: string;
  moderatorId: string;
  moderatorUsername: string;
  createdAt: string;
}

export interface ModeratorsListResponse {
  moderators: ModeratorDto[];
}

function mapModeratorRow(
  row: Awaited<ReturnType<typeof listModeratorsForStreamer>>[number]
): ModeratorDto {
  return {
    id: row.id,
    moderatorId: row.moderatorId,
    moderatorUsername: row.moderatorUsername,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

export async function listModeratorsController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const user = parseSessionUser(request);
    if (!user || user.id !== streamerId) {
      return jsonError("Não autorizado", 401, "UNAUTHORIZED");
    }

    const moderators = await listModeratorsForStreamer(streamerId);
    const payload: ModeratorsListResponse = {
      moderators: moderators.map(mapModeratorRow),
    };

    return jsonSuccess(payload);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar moderadores");
  }
}

export async function addModeratorController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const user = parseSessionUser(request);
    if (!user || user.id !== streamerId) {
      return jsonError("Não autorizado", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const username = String(body?.username ?? "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (!username) {
      return jsonError(
        "Informe o usuário Twitch do moderador",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (username === user.twitchUsername?.toLowerCase()) {
      return jsonError(
        "Você não pode adicionar a si mesmo como moderador",
        400,
        "VALIDATION_ERROR"
      );
    }

    const streamer = await getStreamerById(streamerId);
    if (!streamer) {
      return jsonError("Canal não encontrado", 404, "NOT_FOUND");
    }

    const twitchUser = await twitchServerService.getUserByLogin(username);
    if (!twitchUser) {
      return jsonError("Usuário Twitch não encontrado", 404, "NOT_FOUND");
    }

    if (twitchUser.id === streamerId) {
      return jsonError(
        "O dono do canal não pode ser moderador",
        400,
        "VALIDATION_ERROR"
      );
    }

    const existing = await getModeratorAssignment(streamerId, twitchUser.id);
    if (existing) {
      return jsonError("Este usuário já é moderador", 409, "CONFLICT");
    }

    const row = await addStreamerModerator({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      streamerId,
      moderatorId: twitchUser.id,
      moderatorUsername: twitchUser.login,
    });

    return jsonSuccess({ moderator: mapModeratorRow(row) }, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao adicionar moderador");
  }
}

export async function removeModeratorController(
  request: NextRequest,
  streamerId: string
) {
  try {
    const auth = await assertCanManageStreamer(request, streamerId);
    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    if (auth.user.id !== streamerId) {
      return jsonError("Não autorizado", 401, "UNAUTHORIZED");
    }

    const moderatorId = request.nextUrl.searchParams.get("moderatorId")?.trim();
    if (!moderatorId) {
      return jsonError("moderatorId é obrigatório", 400, "VALIDATION_ERROR");
    }

    await removeStreamerModerator(streamerId, moderatorId);
    return jsonSuccess({ success: true });
  } catch (error) {
    return handleRouteError(error, "Falha ao remover moderador");
  }
}
