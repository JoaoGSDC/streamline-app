import { NextRequest } from "next/server";
import { getTwitchBotUsername, resolveBotOwnerStreamerId } from "@lib/bot-auth";
import {
  activateBotChannel,
  deactivateBotChannel,
  getBotActiveChannel,
  isBotChannelActive,
} from "@lib/bot-db-queries";
import { getStreamerById } from "@lib/db-queries";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

function mapActivationResponse(
  streamerId: string,
  twitchUsername: string,
  active: boolean,
  createdAt: Date | null,
  updatedAt: Date | null,
  deactivatedAt: Date | null
) {
  return {
    active,
    streamerId,
    twitchUsername,
    botUsername: getTwitchBotUsername(),
    createdAt: createdAt?.toISOString() ?? null,
    updatedAt: updatedAt?.toISOString() ?? null,
    deactivatedAt: deactivatedAt?.toISOString() ?? null,
  };
}

export async function getBotActivationController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const streamer = await getStreamerById(resolved.streamerId);
    if (!streamer) {
      return jsonError("Streamer não encontrado", 404, "NOT_FOUND");
    }

    const row = await getBotActiveChannel(resolved.streamerId);
    const active = await isBotChannelActive(resolved.streamerId);

    return jsonSuccess(
      mapActivationResponse(
        resolved.streamerId,
        row?.twitchUsername ?? streamer.twitchUsername,
        active,
        row?.createdAt ?? null,
        row?.updatedAt ?? null,
        row?.deactivatedAt ?? null
      )
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao consultar ativação do bot");
  }
}

export async function activateBotChannelController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const streamer = await getStreamerById(resolved.streamerId);
    if (!streamer) {
      return jsonError("Streamer não encontrado", 404, "NOT_FOUND");
    }

    const alreadyActive = await isBotChannelActive(resolved.streamerId);
    if (alreadyActive) {
      const row = await getBotActiveChannel(resolved.streamerId);
      return jsonSuccess(
        mapActivationResponse(
          resolved.streamerId,
          row?.twitchUsername ?? streamer.twitchUsername,
          true,
          row?.createdAt ?? null,
          row?.updatedAt ?? null,
          null
        )
      );
    }

    const result = await activateBotChannel(
      resolved.streamerId,
      streamer.twitchUsername
    );

    return jsonSuccess(
      mapActivationResponse(
        result.streamerId,
        result.twitchUsername,
        true,
        result.createdAt,
        result.updatedAt,
        null
      ),
      result.reactivated ? 200 : 201
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao ativar o bot");
  }
}

export async function deactivateBotChannelController(request: NextRequest) {
  try {
    const resolved = await resolveBotOwnerStreamerId(request);
    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status, resolved.code);
    }

    const streamer = await getStreamerById(resolved.streamerId);
    if (!streamer) {
      return jsonError("Streamer não encontrado", 404, "NOT_FOUND");
    }

    const result = await deactivateBotChannel(resolved.streamerId);
    if (!result) {
      return jsonSuccess(
        mapActivationResponse(
          resolved.streamerId,
          streamer.twitchUsername,
          false,
          null,
          null,
          null
        )
      );
    }

    const row = await getBotActiveChannel(resolved.streamerId);

    return jsonSuccess(
      mapActivationResponse(
        result.streamerId,
        result.twitchUsername,
        false,
        row?.createdAt ?? null,
        row?.updatedAt ?? null,
        result.deactivatedAt
      )
    );
  } catch (error) {
    return handleRouteError(error, "Falha ao desativar o bot");
  }
}
