import { postQuotesInternalCreateController } from "@api/internal/quotes/quotes-internal.controller";

type RouteContext = { params: Promise<{ streamerId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { streamerId } = await context.params;
  return postQuotesInternalCreateController(request as never, streamerId);
}
