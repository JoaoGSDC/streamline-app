import {
  createCounterController,
  listCountersController,
} from "@api/internal/counters/counters.controller";

export const GET = listCountersController;
export const POST = createCounterController;
