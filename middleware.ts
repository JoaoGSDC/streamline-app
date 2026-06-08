import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveFeatureKeyForAdminPath } from "@/config/panel-route-map";

const FEATURE_DISABLED_PATH = "/admin/feature-disabled";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (
      pathname === FEATURE_DISABLED_PATH ||
      pathname === "/admin/personalizacao"
    ) {
      return NextResponse.next();
    }

    const featureKey = resolveFeatureKeyForAdminPath(pathname);
    if (featureKey) {
      const checkUrl = new URL("/api/panel/config/check", request.url);
      checkUrl.searchParams.set("feature", featureKey);

      const res = await fetch(checkUrl.toString(), {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      });

      if (res.ok) {
        const state = (await res.json()) as {
          enabled?: boolean;
          locked?: boolean;
          reason?: string;
        };

        if (!state.enabled) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = FEATURE_DISABLED_PATH;
          redirectUrl.searchParams.set("feature", featureKey);
          redirectUrl.searchParams.set("reason", state.reason ?? "disabled");
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
