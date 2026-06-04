import {
  createStoreProductController,
  listStoreProductsController,
} from "@api/internal/store/store.controller";

export const GET = listStoreProductsController;
export const POST = createStoreProductController;
