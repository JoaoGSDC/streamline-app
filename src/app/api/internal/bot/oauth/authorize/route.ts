import type { NextRequest } from "next/server";
import { getBotTwitchOAuthAuthorizeController } from "@api/internal/bot/bot-oauth.controller";

export async function GET(request: NextRequest) {
  return getBotTwitchOAuthAuthorizeController(request);
}
