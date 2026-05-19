import { NextRequest, NextResponse } from "next/server";
import { getStreamerByUsername } from "@/lib/db-queries";
import { resolveStreamerSocialLinks } from "@/lib/streamer-social";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const streamer = await getStreamerByUsername(username);

    if (!streamer) {
      return NextResponse.json({ links: [] });
    }

    const links = resolveStreamerSocialLinks(
      streamer.socialLinks,
      streamer.bio || "",
      streamer.twitchUrl || `https://twitch.tv/${username}`
    );

    return NextResponse.json({
      links,
      pageConfig: streamer.linkPageConfig,
      streamer: {
        name: streamer.name,
        twitchUsername: streamer.twitchUsername,
        avatar: streamer.avatar,
        bio: streamer.bio,
        twitchUrl: streamer.twitchUrl,
        partner: streamer.partner,
        premium: streamer.premium,
      },
    });
  } catch (error) {
    console.error("GET public social-links error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar links" },
      { status: 500 }
    );
  }
}
