import { z } from "zod";
import {
  COUNTER_CHANGE_SOURCES,
  COUNTER_OPERATIONS,
  COUNTER_RESET_POLICIES,
  COUNTER_STATUSES,
  COUNTER_TYPES,
} from "./counters.types";

export function slugifyCounterText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const overlayConfigSchema = z
  .object({
    layout: z.enum(["horizontal", "vertical", "compact"]).optional(),
    showLabel: z.boolean().optional(),
    showEmoji: z.boolean().optional(),
    prefix: z.string().max(80).optional(),
    suffix: z.string().max(80).optional(),
    fontSize: z.number().int().min(8).max(200).optional(),
    textColor: z.string().max(20).optional(),
    accentColor: z.string().max(20).optional(),
    showGoal: z.boolean().optional(),
    animation: z.enum(["none", "pulse", "shake"]).optional(),
  })
  .optional();

export const createCounterCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
});

export const createCounterSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(COUNTER_TYPES).optional(),
  value: z.number().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  goalValue: z.number().positive().nullable().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).nullable().optional(),
  emoji: z.string().max(10).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  resetPolicy: z.enum(COUNTER_RESET_POLICIES).optional(),
  overlayConfig: overlayConfigSchema,
});

export const updateCounterSchema = createCounterSchema.partial().extend({
  status: z.enum(COUNTER_STATUSES).optional(),
  sortOrder: z.number().int().optional(),
});

export const adjustCounterSchema = z.object({
  operation: z.enum(COUNTER_OPERATIONS),
  amount: z.number().optional(),
  source: z.enum(COUNTER_CHANGE_SOURCES).optional(),
});

export const updateCountersConfigSchema = z.object({
  enabled: z.boolean().optional(),
  liveModePins: z.array(z.string()).max(12).optional(),
});

export const botAdjustCounterSchema = z.object({
  slug: z.string().min(1).max(80),
  operation: z.enum(COUNTER_OPERATIONS),
  amount: z.number().optional(),
  twitchUserId: z.string().optional(),
  twitchUsername: z.string().optional(),
  displayName: z.string().optional(),
  source: z.enum(COUNTER_CHANGE_SOURCES).optional(),
});

export function formatCountersZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
