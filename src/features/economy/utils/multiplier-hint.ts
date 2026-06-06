export type MultiplierRole = "subscriber" | "vip" | "moderator";

export function getMultiplierHint(
  value: number,
  role: MultiplierRole = "subscriber"
): string {
  if (value <= 1) return "Sem bônus (padrão)";
  if (value >= 3) return "Bônus agressivo";
  if (value >= 1.1 && value < 2) return "Bônus moderado";
  if (value >= 2 && value < 3) {
    if (value === 2 && role === "subscriber") {
      return "2× os pontos (recomendado para inscritos)";
    }
    return "2× os pontos";
  }
  return `${value.toFixed(1)}× os pontos`;
}
