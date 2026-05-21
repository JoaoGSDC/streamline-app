import { getPublicSocialLinksController } from "@api/internal/streamers/social-links.controller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  return getPublicSocialLinksController(username);
}
