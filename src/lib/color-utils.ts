/** Converte cores comuns (hex, hsl) para #rrggbb do input type=color */
export function colorToHex(input: string, fallback = "#8b5cf6"): string {
  const raw = input?.trim();
  if (!raw) return fallback;

  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();

  const cssVar = CSS_VAR_FALLBACKS[raw];
  if (cssVar) return cssVar;

  const hslMatch = raw.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%/i
  );
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    return hslToHex(h, s, l);
  }

  return fallback;
}

const CSS_VAR_FALLBACKS: Record<string, string> = {
  "hsl(var(--twitch))": "#9146ff",
  "hsl(var(--foreground))": "#e8e8f0",
  "hsl(var(--muted-foreground))": "#9ca3af",
  "hsl(var(--primary))": "#a855f7",
  "hsl(var(--secondary-container))": "#22d3ee",
};

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toByte = (n: number) =>
    Math.round(Math.max(0, Math.min(255, (n + m) * 255)))
      .toString(16)
      .padStart(2, "0");

  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/** Se o valor já for hex, retorna; senão converte hsl/css para hex */
export function normalizeColorForPicker(value: string, fallback?: string): string {
  return colorToHex(value, fallback ?? "#8b5cf6");
}
