import { NextRequest, NextResponse } from "next/server";
import {
  getStreamerById,
  updateStreamerSocialLinks,
  type StreamerSocialLink,
} from "@/lib/db-queries";
import { assertCanManageStreamer } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await assertCanManageStreamer(request, id);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const streamer = await getStreamerById(id);
    if (!streamer) {
      return NextResponse.json({ error: "Streamer não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ links: streamer.socialLinks ?? [] });
  } catch (error) {
    console.error("GET social-links error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar links" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await assertCanManageStreamer(request, id);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const links = Array.isArray(body?.links) ? body.links : [];
    const sanitized: StreamerSocialLink[] = links
      .map((l: { label?: string; url?: string }) => ({
        label: String(l.label ?? "").trim(),
        url: String(l.url ?? "").trim(),
      }))
      .filter((l: StreamerSocialLink) => l.label && l.url);

    for (const link of sanitized) {
      try {
        const parsed = new URL(link.url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: "URLs devem usar http ou https" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: `URL inválida: ${link.label}` },
          { status: 400 }
        );
      }
    }

    const updated = await updateStreamerSocialLinks(id, sanitized);
    if (!updated) {
      return NextResponse.json({ error: "Streamer não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ links: updated.socialLinks ?? [] });
  } catch (error) {
    console.error("PUT social-links error:", error);
    return NextResponse.json(
      { error: "Falha ao salvar links" },
      { status: 500 }
    );
  }
}
