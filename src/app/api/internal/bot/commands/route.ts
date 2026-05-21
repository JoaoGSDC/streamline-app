import {
  createBotCommandController,
  listBotCommandsController,
} from "@api/internal/bot/commands.controller";

export const GET = listBotCommandsController;
export const POST = createBotCommandController;
