import {
  deleteStoreCategoryController,
  patchStoreCategoryController,
} from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { categoryId } = await context.params;
  return patchStoreCategoryController(request as never, categoryId);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { categoryId } = await context.params;
  return deleteStoreCategoryController(request as never, categoryId);
}
