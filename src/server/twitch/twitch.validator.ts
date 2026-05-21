import { HttpError } from "@server/utils/http-error";

export function validateSearchQuery(query: string | null): string {
  const trimmed = query?.trim() ?? "";
  if (trimmed.length < 2) {
    throw new HttpError("Informe ao menos 2 caracteres em 'q'", 400, "VALIDATION_ERROR");
  }
  return trimmed;
}

export function validateSearchLimit(
  limitParam: string | null,
  defaultLimit: number,
  maxLimit: number
): number {
  if (!limitParam) return defaultLimit;
  const parsed = parseInt(limitParam, 10);
  if (!Number.isFinite(parsed)) return defaultLimit;
  return Math.min(Math.max(parsed, 1), maxLimit);
}

export function normalizeTwitchLogin(login: string): string {
  return login.trim().toLowerCase().replace(/^@/, "");
}
