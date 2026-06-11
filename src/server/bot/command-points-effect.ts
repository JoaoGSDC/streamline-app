import { z } from "zod";
import {
  ECONOMY_LIVE_REWARD_POINTS,
  type EconomyLiveRewardKey,
} from "@server/economy/economy-live-rewards";

export const COMMAND_POINTS_LIMIT_MODES = [
  "none",
  "once_per_user_per_stream",
] as const;

export type CommandPointsLimitMode = (typeof COMMAND_POINTS_LIMIT_MODES)[number];

export const COMMAND_POINTS_MODES = ["fixed", "random", "conditional"] as const;

export type CommandPointsMode = (typeof COMMAND_POINTS_MODES)[number];

export interface CommandPointsConditionalRule {
  variable: string;
  equals: string;
  amount: number;
}

export interface CommandPointsEffect {
  enabled: boolean;
  mode: CommandPointsMode;
  amount?: number;
  min?: number;
  max?: number;
  rules?: CommandPointsConditionalRule[];
  limit: CommandPointsLimitMode;
  requireLive?: boolean;
  liveRewardKey?: EconomyLiveRewardKey;
}

const conditionalRuleSchema = z.object({
  variable: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Variável inválida"),
  equals: z.string().min(1).max(64),
  amount: z.coerce.number().int().min(-1_000_000).max(1_000_000),
});

export const commandPointsEffectSchema = z
  .object({
    enabled: z.boolean(),
    mode: z.enum(COMMAND_POINTS_MODES),
    amount: z.coerce.number().int().min(-1_000_000).max(1_000_000).optional(),
    min: z.coerce.number().int().min(0).max(1_000_000).optional(),
    max: z.coerce.number().int().min(0).max(1_000_000).optional(),
    rules: z.array(conditionalRuleSchema).max(20).optional(),
    limit: z.enum(COMMAND_POINTS_LIMIT_MODES).default("none"),
    requireLive: z.boolean().optional(),
    liveRewardKey: z.enum(["daily", "early"]).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;

    if (value.mode === "fixed") {
      if (value.amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Informe a quantidade de pontos",
        });
      }
      return;
    }

    if (value.mode === "random") {
      if (value.min === undefined || value.max === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["min"],
          message: "Informe mínimo e máximo",
        });
        return;
      }
      if (value.min > value.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max"],
          message: "Máximo deve ser maior ou igual ao mínimo",
        });
      }
      return;
    }

    if (!value.rules?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rules"],
        message: "Adicione ao menos uma regra condicional",
      });
    }
  });

export function parseCommandPointsEffect(
  raw: string | null | undefined
): CommandPointsEffect | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = commandPointsEffectSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializeCommandPointsEffect(
  effect: CommandPointsEffect | null | undefined
): string | null {
  if (!effect) return null;
  return JSON.stringify(effect);
}

export function defaultPointsEffectForBuiltin(
  builtinKey: string | null | undefined,
  economyRewardKey?: EconomyLiveRewardKey | null,
  economyRewardPoints?: number | null
): CommandPointsEffect | null {
  if (economyRewardKey) {
    return {
      enabled: true,
      mode: "fixed",
      amount:
        economyRewardPoints ??
        ECONOMY_LIVE_REWARD_POINTS[economyRewardKey],
      limit: "once_per_user_per_stream",
      requireLive: true,
      liveRewardKey: economyRewardKey,
    };
  }

  if (builtinKey === "first") {
    return {
      enabled: false,
      mode: "conditional",
      rules: [{ variable: "firstResult", equals: "won", amount: 10 }],
      limit: "once_per_user_per_stream",
    };
  }

  return null;
}

export function resolveEditorPointsEffect(input: {
  pointsEffect: CommandPointsEffect | null | undefined;
  builtinKey?: string | null;
  economyRewardKey?: EconomyLiveRewardKey | null;
  economyRewardPoints?: number | null;
}): CommandPointsEffect {
  if (input.pointsEffect) return input.pointsEffect;
  return (
    defaultPointsEffectForBuiltin(
      input.builtinKey,
      input.economyRewardKey,
      input.economyRewardPoints
    ) ?? {
      enabled: false,
      mode: "fixed",
      amount: 0,
      limit: "none",
    }
  );
}

export const COMMAND_POINTS_RUNTIME_VARIABLES = [
  {
    name: "pointsAdded",
    description: "Pontos concedidos ou removidos neste uso do comando",
  },
  {
    name: "jokenpoResult",
    description: "Resultado do !jokenpo: win, lose ou draw",
  },
  {
    name: "coinResult",
    description: "Resultado do !moeda: win ou lose",
  },
  {
    name: "firstResult",
    description: "Resultado do !first: won (foi o primeiro) ou already_taken",
  },
] as const;
