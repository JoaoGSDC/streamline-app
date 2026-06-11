import { NextRequest } from "next/server";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  cancelRaffle,
  closeRaffle,
  confirmRaffleWinner,
  createRaffle,
  drawRaffleWinners,
  getActiveRaffleForStreamer,
  getRaffleWithStats,
  insertRaffleEntry,
  listMessagesSince,
  listRaffleHistory,
  pauseRaffle,
  removeRaffleEntry,
  reopenRaffle,
  rerollRaffleWinner,
  resumeRaffle,
  startRaffle,
  updateRaffleConfig,
} from "@lib/raffles-db-queries";
import {
  formatRafflesZodError,
  raffleCreateSchema,
  raffleManualEntrySchema,
  raffleRerollSchema,
  raffleUpdateSchema,
} from "@server/raffles/raffles.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { assertFeatureEnabledForStreamer } from "@server/panel/assert-feature-enabled";
import { subscribeRaffleEvents } from "@server/raffles/raffle-events";

async function resolveManager(request: NextRequest) {
  return resolveActingStreamerId(request);
}

async function assertRafflesFeature(streamerId: string) {
  await assertFeatureEnabledForStreamer(streamerId, "raffles");
}

export async function getActiveRaffleController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await assertRafflesFeature(resolved.streamerId);

    const active = await getActiveRaffleForStreamer(resolved.streamerId);
    if (!active) return jsonSuccess(null);
    const full = await getRaffleWithStats(active.id, resolved.streamerId);
    return jsonSuccess(full);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar sorteio ativo");
  }
}

export async function createRaffleController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await assertRafflesFeature(resolved.streamerId);

    const body = await request.json();
    const parsed = raffleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatRafflesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const raffle = await createRaffle(resolved.streamerId, parsed.data);
    return jsonSuccess(raffle, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar sorteio");
  }
}

export async function getRaffleController(
  request: NextRequest,
  raffleId: string
) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await assertRafflesFeature(resolved.streamerId);

    const raffle = await getRaffleWithStats(raffleId, resolved.streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar sorteio");
  }
}

export async function updateRaffleController(
  request: NextRequest,
  raffleId: string
) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await assertRafflesFeature(resolved.streamerId);

    const body = await request.json();
    const parsed = raffleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatRafflesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const raffle = await updateRaffleConfig(raffleId, resolved.streamerId, parsed.data);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar sorteio");
  }
}

export async function startRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await startRaffle(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao iniciar sorteio");
  }
}

export async function pauseRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await pauseRaffle(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao pausar sorteio");
  }
}

export async function resumeRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await resumeRaffle(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao retomar sorteio");
  }
}

export async function closeRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await closeRaffle(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao encerrar sorteio");
  }
}

export async function reopenRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await reopenRaffle(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao reabrir sorteio");
  }
}

export async function drawRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await drawRaffleWinners(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao sortear");
  }
}

export async function rerollRaffleController(
  request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = raffleRerollSchema.safeParse(body);
    if (!parsed.success || !parsed.data.winnerId) {
      return jsonError("winnerId obrigatório", 400, "VALIDATION_ERROR");
    }

    const raffle = await rerollRaffleWinner(
      raffleId,
      streamerId,
      parsed.data.winnerId,
      parsed.data.reason
    );
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao re-rolar");
  }
}

export async function confirmWinnerController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string,
  winnerId: string
) {
  try {
    const raffle = await confirmRaffleWinner(raffleId, streamerId, winnerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao confirmar vencedor");
  }
}

export async function addManualEntryController(
  request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const body = await request.json();
    const parsed = raffleManualEntrySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatRafflesZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const login = parsed.data.twitchLogin.replace(/^@/, "").toLowerCase();
    const { entry } = await insertRaffleEntry({
      raffleId,
      twitchUserId: `manual-${login}`,
      twitchLogin: login,
      displayName: parsed.data.displayName ?? login,
      source: "manual",
      entryCount: parsed.data.entryCount,
    });

    const raffle = await getRaffleWithStats(raffleId, streamerId);
    return jsonSuccess({ entry, raffle });
  } catch (error) {
    return handleRouteError(error, "Falha ao adicionar participante");
  }
}

export async function removeEntryController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string,
  entryId: string
) {
  try {
    const raffle = await removeRaffleEntry(raffleId, streamerId, entryId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao remover participante");
  }
}

export async function listRaffleHistoryController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await assertRafflesFeature(resolved.streamerId);

    const history = await listRaffleHistory(resolved.streamerId);
    return jsonSuccess(history);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar histórico");
  }
}

export async function cancelRaffleController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await cancelRaffle(raffleId, streamerId);
    return jsonSuccess(raffle);
  } catch (error) {
    return handleRouteError(error, "Falha ao cancelar sorteio");
  }
}

export async function exportRaffleCsvController(
  _request: NextRequest,
  raffleId: string,
  streamerId: string
) {
  try {
    const raffle = await getRaffleWithStats(raffleId, streamerId);
    const lines = ["login,displayName,entryCount"];
    for (const entry of raffle.entries) {
      lines.push(
        `${entry.twitchLogin},${entry.displayName.replace(/,/g, " ")},${entry.entryCount}`
      );
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="raffle-${raffleId}.csv"`,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao exportar CSV");
  }
}

export async function raffleStreamController(
  request: NextRequest,
  raffleId: string
) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) {
      return new Response(resolved.error, { status: resolved.status });
    }

    await assertRafflesFeature(resolved.streamerId);

    const raffle = await getRaffleWithStats(raffleId, resolved.streamerId).catch(() => null);
  if (!raffle) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  let lastMessageId = raffle.recentMessages.at(-1)?.id ?? 0;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("snapshot", raffle);

      const unsubscribe = subscribeRaffleEvents(raffleId, (event) => {
        send(event.type, event.data);
      });

      const pollId = setInterval(async () => {
        try {
          const messages = await listMessagesSince(raffleId, lastMessageId);
          if (messages.length > 0) {
            lastMessageId = messages[messages.length - 1]!.id;
            send("messages", messages);
          }
        } catch {
          /* ignore poll errors */
        }
      }, 800);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollId);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
  } catch (error) {
    const response = handleRouteError(error, "Falha no stream do sorteio");
    return new Response(await response.text(), { status: response.status });
  }
}

export async function resolveStreamerForRaffleAction(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return { error: jsonError(resolved.error, resolved.status) };

    await assertRafflesFeature(resolved.streamerId);

    return { streamerId: resolved.streamerId };
  } catch (error) {
    return { error: handleRouteError(error, "Não autorizado") };
  }
}
