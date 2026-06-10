import {
  createQuoteCategoryController,
  listQuoteCategoriesController,
} from "@api/internal/quotes/quotes.controller";

export const GET = listQuoteCategoriesController;
export const POST = createQuoteCategoryController;
