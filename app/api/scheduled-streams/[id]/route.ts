import { NextRequest, NextResponse } from "next/server";
import { deleteScheduledStream, getScheduledStreamById } from "@/lib/db-queries";
import { assertCanManageStreamer } from "@/lib/admin-auth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const stream = await getScheduledStreamById(id);
    if (!stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await assertCanManageStreamer(request, stream.streamerId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
