import { NextRequest } from "next/server";
import {
  deleteStreamerGameController,
  updateStreamerGameController,
} from "@api/internal/streamer-games/streamer-games-by-id.controller";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateStreamerGameController(request, id);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return deleteStreamerGameController(request, id);
}
