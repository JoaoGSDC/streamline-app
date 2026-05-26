import {
  activateBotChannelController,
  deactivateBotChannelController,
  getBotActivationController,
} from "@api/internal/bot/activation.controller";

export const GET = getBotActivationController;
export const POST = activateBotChannelController;
export const DELETE = deactivateBotChannelController;
