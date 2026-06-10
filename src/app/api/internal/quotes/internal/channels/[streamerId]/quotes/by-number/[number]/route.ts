import { getQuotesInternalByNumberController } from "@api/internal/quotes/quotes-internal.controller";

type RouteContext = { params: Promise<{ streamerId: string; number: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { streamerId, number } = await context.params;
  return getQuotesInternalByNumberController(
    request as never,
    streamerId,
    Number(number)
  );
}
