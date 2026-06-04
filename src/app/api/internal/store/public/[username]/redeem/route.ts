import { postPublicRedeemController } from "@api/internal/store/store.controller";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { username } = await context.params;
  return postPublicRedeemController(request as never, username);
}
