import { NextRequest } from "next/server";
import { syncStreamerController } from "@api/internal/streamers/streamers-sync.controller";

export async function POST(request: NextRequest) {
  return syncStreamerController(request);
}
