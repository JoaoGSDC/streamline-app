import {
  cancelRaffleController,
  getRaffleController,
  resolveStreamerForRaffleAction,
  updateRaffleController,
} from "@api/internal/raffles/raffles.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return getRaffleController(request as never, id);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateRaffleController(request as never, id);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const resolved = await resolveStreamerForRaffleAction(request as never);
  if ("error" in resolved) return resolved.error;
  return cancelRaffleController(request as never, id, resolved.streamerId);
}
