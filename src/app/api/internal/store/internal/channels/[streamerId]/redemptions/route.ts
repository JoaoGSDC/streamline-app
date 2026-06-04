import { getStoreInternalRedemptionsController } from "@api/internal/store/store-internal.controller";

type RouteContext = { params: Promise<{ streamerId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { streamerId } = await context.params;
  return getStoreInternalRedemptionsController(request as never, streamerId);
}
