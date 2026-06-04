import { postStoreInternalRedeemController } from "@api/internal/store/store-internal.controller";

type RouteContext = { params: Promise<{ streamerId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { streamerId } = await context.params;
  return postStoreInternalRedeemController(request as never, streamerId);
}
