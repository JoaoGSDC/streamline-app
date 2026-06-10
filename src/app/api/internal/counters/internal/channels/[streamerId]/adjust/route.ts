import { postCountersInternalAdjustController } from "@api/internal/counters/counters-internal.controller";

export async function POST(
  request: Request,
  context: { params: Promise<{ streamerId: string }> }
) {
  const { streamerId } = await context.params;
  return postCountersInternalAdjustController(request as never, streamerId);
}
