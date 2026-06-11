import { z } from "zod";
import type { CounterOperation } from "@server/counters/counters.types";

export const COMMAND_COUNTER_OPERATIONS = [
  "increment",
  "decrement",
  "set",
  "reset",
] as const;

export type CommandCounterOperation = (typeof COMMAND_COUNTER_OPERATIONS)[number];

export interface CommandCounterEffect {
  enabled: boolean;
  slug: string;
  operation: CommandCounterOperation;
  amount?: number;
}

export const commandCounterEffectSchema = z
  .object({
    enabled: z.boolean(),
    slug: z
      .string()
      .min(1, "Selecione um contador")
      .max(64)
      .regex(/^[a-z0-9_-]+$/, "Identificador inválido"),
    operation: z.enum(COMMAND_COUNTER_OPERATIONS).default("increment"),
    amount: z.coerce.number().min(0).max(1_000_000).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;

    if (
      (value.operation === "increment" || value.operation === "decrement") &&
      value.amount !== undefined &&
      value.amount < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Quantidade deve ser pelo menos 1",
      });
    }

    if (value.operation === "set" && value.amount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Informe o valor para definir o contador",
      });
    }
  });

export function parseCommandCounterEffect(
  raw: string | null | undefined
): CommandCounterEffect | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = commandCounterEffectSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializeCommandCounterEffect(
  effect: CommandCounterEffect | null | undefined
): string | null {
  if (!effect) return null;
  return JSON.stringify(effect);
}

export function resolveEditorCounterEffect(
  effect: CommandCounterEffect | null | undefined
): CommandCounterEffect {
  return (
    effect ?? {
      enabled: false,
      slug: "",
      operation: "increment",
      amount: 1,
    }
  );
}

export const COMMAND_COUNTER_RUNTIME_VARIABLES = [
  {
    name: "count:<slug>",
    description: "Valor atual do contador após o efeito (ex.: {count:mortes})",
  },
] as const;
