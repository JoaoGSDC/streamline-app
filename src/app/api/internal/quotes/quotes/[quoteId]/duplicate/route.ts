import { duplicateQuoteController } from "@api/internal/quotes/quotes.controller";

type RouteContext = { params: Promise<{ quoteId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { quoteId } = await context.params;
  return duplicateQuoteController(request as never, quoteId);
}
