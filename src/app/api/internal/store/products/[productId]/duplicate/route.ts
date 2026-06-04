import { duplicateStoreProductController } from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ productId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  return duplicateStoreProductController(request as never, productId);
}
