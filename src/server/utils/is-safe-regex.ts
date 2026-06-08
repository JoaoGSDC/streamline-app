import safeRegex from "safe-regex2";

/**
 * Heurística anti-ReDoS para padrões aceitos em comandos customizados.
 * Usa safe-regex2 + validação sintática e limites de tamanho.
 */
export function isSafeRegex(pattern: string): boolean {
  const clean = pattern.replace(/^\/(.*)\/[gimsuy]*$/, "$1");

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
