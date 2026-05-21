import {
  deleteBotBlacklistController,
  patchBotBlacklistController,
} from "@api/internal/bot/blacklist-by-id.controller";

export const PATCH = patchBotBlacklistController;
export const DELETE = deleteBotBlacklistController;
