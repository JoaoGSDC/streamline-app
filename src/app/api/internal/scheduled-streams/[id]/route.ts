import { NextRequest } from "next/server";
import {
  deleteScheduledStreamController,
  updateScheduledStreamController,
} from "@api/internal/scheduled-streams/scheduled-streams-by-id.controller";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateScheduledStreamController(request, id);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return deleteScheduledStreamController(request, id);
}
