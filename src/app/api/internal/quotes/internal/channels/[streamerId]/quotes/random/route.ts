import { getQuotesInternalRandomController } from "@api/internal/quotes/quotes-internal.controller";

type RouteContext = { params: Promise<{ streamerId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { streamerId } = await context.params;
  return getQuotesInternalRandomController(request as never, streamerId);
}
