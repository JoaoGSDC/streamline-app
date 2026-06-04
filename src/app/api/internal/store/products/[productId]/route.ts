import {
  getStoreProductController,
  patchStoreProductController,
} from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  return getStoreProductController(request as never, productId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  return patchStoreProductController(request as never, productId);
}
