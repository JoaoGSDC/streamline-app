import { NextRequest } from "next/server";
import {
  getStreamerSocialLinksController,
  updateStreamerSocialLinksController,
} from "@api/internal/streamers/social-links.controller";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return getStreamerSocialLinksController(request, id);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateStreamerSocialLinksController(request, id);
}
