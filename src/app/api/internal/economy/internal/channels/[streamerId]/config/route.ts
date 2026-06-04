import { getEconomyInternalConfigController } from "@api/internal/economy/economy-internal.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ streamerId: string }> }
) {
  const { streamerId } = await context.params;
  return getEconomyInternalConfigController(request as never, streamerId);
}
