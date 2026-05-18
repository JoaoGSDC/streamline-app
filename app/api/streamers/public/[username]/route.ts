import { NextRequest, NextResponse } from "next/server";
import { getStreamerByUsername } from "@/lib/db-queries";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const streamer = await getStreamerByUsername(username);

    if (!streamer) {
      return NextResponse.json({ partner: false, premium: false });
    }

    return NextResponse.json({
      partner: streamer.partner,
      premium: streamer.premium,
    });
  } catch (error) {
    console.error("GET public streamer error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar dados do streamer" },
      { status: 500 }
    );
  }
}
