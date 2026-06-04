import { postEconomyInternalAwardXpController } from "@api/internal/economy/economy-internal.controller";

export async function POST(
  request: Request,
  context: { params: Promise<{ streamerId: string }> }
) {
  const { streamerId } = await context.params;
  return postEconomyInternalAwardXpController(request as never, streamerId);
}
