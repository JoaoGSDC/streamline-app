import { HttpError } from "@server/utils/http-error";

export function validateIgdbSearchQuery(query: string | null): string {
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    throw new HttpError("Parâmetro 'q' é obrigatório", 400, "VALIDATION_ERROR");
  }
  return trimmed;
}

export function validateIgdbSearchLimit(
  limitParam: string | null,
  defaultLimit = 10,
  maxLimit = 50
): number {
  if (!limitParam) return defaultLimit;
  const parsed = parseInt(limitParam, 10);
  if (!Number.isFinite(parsed)) return defaultLimit;
  return Math.min(Math.max(parsed, 1), maxLimit);
}

export function validateIgdbGameId(idParam: string): number {
  const gameId = Number(idParam);
  if (!Number.isFinite(gameId)) {
    throw new HttpError("ID inválido", 400, "VALIDATION_ERROR");
  }
  return gameId;
}
