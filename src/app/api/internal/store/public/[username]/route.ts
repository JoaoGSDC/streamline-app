import { getPublicStoreController } from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { username } = await context.params;
  return getPublicStoreController(request as never, username);
}
