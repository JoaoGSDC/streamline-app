import {
  deleteQuoteController,
  getQuoteController,
  patchQuoteController,
} from "@api/internal/quotes/quotes.controller";

type RouteContext = { params: Promise<{ quoteId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { quoteId } = await context.params;
  return getQuoteController(request as never, quoteId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { quoteId } = await context.params;
  return patchQuoteController(request as never, quoteId);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { quoteId } = await context.params;
  return deleteQuoteController(request as never, quoteId);
}
