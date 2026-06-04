import { getEconomyInternalBalanceController } from "@api/internal/economy/economy-internal.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ streamerId: string; twitchUserId: string }> }
) {
  const { streamerId, twitchUserId } = await context.params;
  return getEconomyInternalBalanceController(
    request as never,
    streamerId,
    twitchUserId
  );
}
