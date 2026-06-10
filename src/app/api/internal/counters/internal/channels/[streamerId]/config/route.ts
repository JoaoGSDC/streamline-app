import { getCountersInternalConfigController } from "@api/internal/counters/counters-internal.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ streamerId: string }> }
) {
  const { streamerId } = await context.params;
  return getCountersInternalConfigController(request as never, streamerId);
}
