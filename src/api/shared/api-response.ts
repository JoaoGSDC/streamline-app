import { NextResponse } from "next/server";
import { HttpError, isHttpError } from "@server/utils/http-error";

export function jsonSuccess<T>(payload: T, status = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export function jsonError(
  message: string,
  status = 500,
  code = "INTERNAL_ERROR"
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export function handleRouteError(error: unknown, fallbackMessage: string): NextResponse {
  if (isHttpError(error)) {
    return jsonError(error.message, error.statusCode, error.code);
  }

  console.error(fallbackMessage, error);
  return jsonError(fallbackMessage, 500);
}
