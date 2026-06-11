import {
  resolveStreamerForRaffleAction,
  resumeRaffleController,
} from "@api/internal/raffles/raffles.controller";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const resolved = await resolveStreamerForRaffleAction(request as never);
  if ("error" in resolved) return resolved.error;
  return resumeRaffleController(request as never, id, resolved.streamerId);
}
