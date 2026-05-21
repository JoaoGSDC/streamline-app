import {
  deleteBotCommandController,
  getBotCommandByIdController,
  patchBotCommandController,
} from "@api/internal/bot/commands-by-id.controller";

export const GET = getBotCommandByIdController;
export const PATCH = patchBotCommandController;
export const DELETE = deleteBotCommandController;
