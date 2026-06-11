export const MAX_SAFE_REGEX_LENGTH = 300;

export type RegexTestResult = "match" | "no_match" | "invalid" | "timeout";

const EVASION_CHAR_MAP: Record<string, string> = {
  a: "[a@áàãâ4]",
  b: "b",
  c: "[cç]",
  d: "d",
  e: "[e3éê]",
  f: "f",
  g: "g",
  h: "h",
  i: "[i1í!|]",
  j: "j",
  k: "k",
  l: "[l1|]",
  m: "m",
  n: "n",
  o: "[o0óõô]",
  p: "p",
  q: "q",
  r: "r",
  s: "[s5$]",
  t: "t",
  u: "[uú]",
  v: "v",
  w: "w",
  x: "x",
  y: "y",
  z: "[z2]",
};

/** Remove delimitadores /pattern/flags comuns em editores de regex. */
export function cleanRegexPattern(pattern: string): string {
  return pattern.trim().replace(/^\/(.*)\/[gimsuy]*$/, "$1");
}

/**
 * Gera um pattern tolerante a evasões comuns (leetspeak, caracteres extras).
 * Ex.: "bola" → b.{0,3}?[o0óõô].{0,3}?[l1|].{0,3}?[a@áàãâ4]
 */
export function buildWordEvasionRegex(word: string): string | null {
  const normalized = word.trim().toLowerCase();
  if (!normalized || normalized.length > 32) return null;
  if (!/^[a-z0-9\s-]+$/i.test(normalized)) return null;

  const parts = normalized.replace(/\s+/g, "").split("").map((char) => {
    const mapped = EVASION_CHAR_MAP[char];
    if (mapped) return mapped;
    if (/[a-z0-9]/i.test(char)) {
      return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    return null;
  });

  if (parts.some((part) => part === null)) return null;

  return parts.join(".{0,3}?");
}

export function testRegexSafely(
  pattern: string,
  input: string,
  timeoutMs = 500
): Promise<RegexTestResult> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve("timeout"), timeoutMs);

    try {
      const regex = new RegExp(cleanRegexPattern(pattern), "i");
      const matched = regex.test(input);
      window.clearTimeout(timer);
      resolve(matched ? "match" : "no_match");
    } catch {
      window.clearTimeout(timer);
      resolve("invalid");
    }
  });
}
