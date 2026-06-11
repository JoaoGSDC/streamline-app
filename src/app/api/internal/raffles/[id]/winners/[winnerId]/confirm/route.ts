import {
  confirmWinnerController,
  resolveStreamerForRaffleAction,
} from "@api/internal/raffles/raffles.controller";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; winnerId: string }> }
) {
  const { id, winnerId } = await context.params;
  const resolved = await resolveStreamerForRaffleAction(request as never);
  if ("error" in resolved) return resolved.error;
  return confirmWinnerController(request as never, id, resolved.streamerId, winnerId);
}
