import { getStoreInternalBalanceController } from "@api/internal/store/store-internal.controller";

type RouteContext = {
  params: Promise<{ streamerId: string; twitchUserId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { streamerId, twitchUserId } = await context.params;
  return getStoreInternalBalanceController(
    request as never,
    streamerId,
    twitchUserId
  );
}
