import {
  deleteBotTimerController,
  patchBotTimerController,
} from "@api/internal/bot/timers-by-id.controller";

export const PATCH = patchBotTimerController;
export const DELETE = deleteBotTimerController;
