import { postQuotesInternalDisplayedController } from "@api/internal/quotes/quotes-internal.controller";

type RouteContext = { params: Promise<{ streamerId: string; quoteId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { streamerId, quoteId } = await context.params;
  return postQuotesInternalDisplayedController(request as never, streamerId, quoteId);
}
