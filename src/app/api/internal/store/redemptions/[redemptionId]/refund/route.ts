import { postRefundRedemptionController } from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ redemptionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { redemptionId } = await context.params;
  return postRefundRedemptionController(request as never, redemptionId);
}
