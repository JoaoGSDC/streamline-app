import { patchStoreRedemptionController } from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ redemptionId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { redemptionId } = await context.params;
  return patchStoreRedemptionController(request as never, redemptionId);
}
