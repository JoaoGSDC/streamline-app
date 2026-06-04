import { getEconomyBalanceController } from "@api/internal/economy/economy.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ twitchUserId: string }> }
) {
  const { twitchUserId } = await context.params;
  return getEconomyBalanceController(request as never, twitchUserId);
}
