import {
  createCounterCategoryController,
  listCounterCategoriesController,
} from "@api/internal/counters/counters.controller";

export const GET = listCounterCategoriesController;
export const POST = createCounterCategoryController;
