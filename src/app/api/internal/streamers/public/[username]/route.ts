import { getPublicStreamerFlagsController } from "@api/internal/streamers/public-streamer.controller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  return getPublicStreamerFlagsController(username);
}
