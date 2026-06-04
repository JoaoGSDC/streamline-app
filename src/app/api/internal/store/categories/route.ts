import {
  createStoreCategoryController,
  listStoreCategoriesController,
} from "@api/internal/store/store.controller";

export const GET = listStoreCategoriesController;
export const POST = createStoreCategoryController;
