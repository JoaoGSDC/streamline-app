import {
  createQuoteController,
  listQuotesController,
} from "@api/internal/quotes/quotes.controller";

export const GET = listQuotesController;
export const POST = createQuoteController;
