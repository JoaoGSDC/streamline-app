import { NextRequest, NextResponse } from "next/server";
import { parseSessionUser } from "@lib/admin-auth";
import {
  ADMIN_ACTING_AS_COOKIE,
  TWITCH_SESSION_COOKIE,
} from "@server/auth/session.constants";
import { jsonSuccess } from "@api/shared/api-response";

export async function getSessionController(request: NextRequest) {
  const sessionUser = parseSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return jsonSuccess({
    authenticated: true,
    user: sessionUser,
  });
}

export async function logoutSessionController() {
  const response = jsonSuccess({ success: true });

  response.cookies.set(TWITCH_SESSION_COOKIE, "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set(ADMIN_ACTING_AS_COOKIE, "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
