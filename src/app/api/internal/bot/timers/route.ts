import {
  createBotTimerController,
  listBotTimersController,
} from "@api/internal/bot/timers.controller";

export const GET = listBotTimersController;
export const POST = createBotTimerController;
