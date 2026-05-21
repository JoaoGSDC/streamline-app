import { NextRequest, NextResponse } from "next/server";
import {
  getStreamerById,
  updateStreamerLinkPage,
} from "@/lib/db-queries";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import { sanitizeLinkPageConfig } from "@/lib/link-page-config";
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

    return NextResponse.json({
      links: streamer.socialLinks ?? [],
      pageConfig: streamer.linkPageConfig,
    });
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
    const hasLinks = Array.isArray(body?.links);
    const hasPageConfig =
      body?.pageConfig && typeof body.pageConfig === "object";

    if (!hasLinks && !hasPageConfig) {
      return NextResponse.json(
        { error: "Envie links e/ou pageConfig" },
        { status: 400 }
      );
    }

    let sanitizedLinks: StreamerSocialLink[] | undefined;
    if (hasLinks) {
      sanitizedLinks = (
        body.links as {
          label?: string;
          url?: string;
          platformId?: string;
          iconColor?: string;
        }[]
      )
        .map((l) => {
          const entry: StreamerSocialLink = {
            label: String(l.label ?? "").trim(),
            url: String(l.url ?? "").trim(),
          };
          const id = String((l as { id?: string }).id ?? "").trim();
          const platformId = String(l.platformId ?? "").trim();
          const iconColor = String(l.iconColor ?? "").trim();
          if (id) entry.id = id;
          if (platformId) entry.platformId = platformId;
          if (iconColor) entry.iconColor = iconColor;
          return entry;
        })
        .filter((l) => l.label && l.url);

      for (const link of sanitizedLinks) {
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
    }

    let pageConfig;
    if (hasPageConfig) {
      pageConfig = sanitizeLinkPageConfig(body.pageConfig);
    }

    const updated = await updateStreamerLinkPage(id, {
      links: sanitizedLinks,
      pageConfig,
    });
    if (!updated) {
      return NextResponse.json({ error: "Streamer não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      links: updated.socialLinks ?? [],
      pageConfig: updated.linkPageConfig,
    });
  } catch (error) {
    console.error("PUT social-links error:", error);
    return NextResponse.json(
      { error: "Falha ao salvar links" },
      { status: 500 }
    );
  }
}
