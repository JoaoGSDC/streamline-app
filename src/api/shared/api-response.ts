import { NextResponse } from "next/server";
import { HttpError, isHttpError } from "@server/utils/http-error";

export function jsonSuccess<T>(
  payload: T,
  status = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(payload, { status, headers });
}

export function jsonError(
  message: string,
  status = 500,
  code = "INTERNAL_ERROR",
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json({ error: message, code }, { status, headers });
}

export function handleRouteError(error: unknown, fallbackMessage: string): NextResponse {
  if (isHttpError(error)) {
    return jsonError(error.message, error.statusCode, error.code);
  }

  console.error(fallbackMessage, error);
  return jsonError(fallbackMessage, 500);
}
