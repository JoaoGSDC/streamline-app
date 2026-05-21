import {
  createBotBlacklistController,
  listBotBlacklistController,
} from "@api/internal/bot/blacklist.controller";

export const GET = listBotBlacklistController;
export const POST = createBotBlacklistController;
