import { NextRequest } from "next/server";
import { resolveBotOwnerStreamerId } from "@lib/bot-auth";

export const ECONOMY_ACCESS_OWNER_ONLY = "ECONOMY_ACCESS_OWNER_ONLY";

export async function resolveEconomyOwnerStreamerId(
  request: NextRequest,
  bodyStreamerId?: string | null
) {
  const resolved = await resolveBotOwnerStreamerId(request, bodyStreamerId);
  if ("error" in resolved) {
    return resolved;
  }
  return resolved;
}
