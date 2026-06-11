import {
  removeEntryController,
  resolveStreamerForRaffleAction,
} from "@api/internal/raffles/raffles.controller";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await context.params;
  const resolved = await resolveStreamerForRaffleAction(request as never);
  if ("error" in resolved) return resolved.error;
  return removeEntryController(request as never, id, resolved.streamerId, entryId);
}
