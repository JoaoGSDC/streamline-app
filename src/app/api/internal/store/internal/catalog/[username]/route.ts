import { getStoreInternalCatalogByUsernameController } from "@api/internal/store/store-internal.controller";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { username } = await context.params;
  return getStoreInternalCatalogByUsernameController(request as never, username);
}
