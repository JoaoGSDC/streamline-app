export const ECONOMY_LIVE_REWARD_KEYS = ["daily", "early"] as const;

export type EconomyLiveRewardKey = (typeof ECONOMY_LIVE_REWARD_KEYS)[number];

/** Pontos concedidos por recompensa (padrão; bot usa valores do catálogo de comandos). */
export const ECONOMY_LIVE_REWARD_POINTS: Record<EconomyLiveRewardKey, number> = {
  daily: 300,
  early: 100,
};

export type EconomyLiveRewardClaimStatus =
  | "claimed"
  | "already_claimed"
  | "economy_disabled";
