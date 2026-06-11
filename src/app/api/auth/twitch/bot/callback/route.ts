import type { NextRequest } from "next/server";
import { handleBotTwitchOAuthCallbackController } from "@api/internal/bot/bot-oauth.controller";

export async function GET(request: NextRequest) {
  return handleBotTwitchOAuthCallbackController(request);
}
