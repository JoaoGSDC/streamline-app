import { NextRequest } from "next/server";
import {
  addModeratorController,
  listModeratorsController,
  removeModeratorController,
} from "@api/internal/streamers/moderators.controller";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return listModeratorsController(request, id);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return addModeratorController(request, id);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return removeModeratorController(request, id);
}
