import { NextRequest, NextResponse } from "next/server";
import { deleteScheduledStream, getScheduledStreamById } from "@/lib/db-queries";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  try {
    const { id } = params;
    // Derivar streamer da sessão
    const sessionCookie = request.cookies.get("twitch_session")?.value;
    let sessionStreamerId: string | null = null;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(sessionCookie);
        sessionStreamerId = parsed?.id || null;
      } catch {
        sessionStreamerId = null;
      }
    }

    if (!sessionStreamerId) {
      return NextResponse.json(
        { error: "Unauthorized: missing session" },
        { status: 401 }
      );
    }

    const stream = await getScheduledStreamById(id);
    if (!stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (stream.streamerId !== sessionStreamerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteScheduledStream(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled stream:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled stream" },
      { status: 500 }
    );
  }
}
