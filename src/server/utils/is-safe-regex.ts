import safeRegex from "safe-regex2";
import { cleanRegexPattern } from "@/lib/regex-utils";

/**
 * Heurística anti-ReDoS para padrões aceitos em comandos customizados e moderação.
 * Usa safe-regex2 + validação sintática e limites de tamanho.
 */
export function isSafeRegex(pattern: string): boolean {
  const clean = cleanRegexPattern(pattern);

  if (clean.length > 300) return false;

  try {
    new RegExp(clean);
  } catch {
    return false;
  }

  if (!safeRegex(clean)) return false;

  if (/\(\?[<!][=!]/.test(clean) && clean.length > 50) return false;

  return true;
}
