import { z } from "zod";

export function slugifyQuoteText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeQuoteSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const streamContextSchema = z
  .object({
    platform: z.string().optional(),
    streamTitle: z.string().nullable().optional(),
    streamCategory: z.string().nullable().optional(),
    gameName: z.string().nullable().optional(),
    streamTags: z.array(z.string()).optional(),
    streamStartedAt: z.union([z.string(), z.date()]).nullable().optional(),
    streamElapsedSeconds: z.number().int().nullable().optional(),
  })
  .optional();

const markersSchema = z
  .object({
    isFavorite: z.boolean().optional(),
    isIconic: z.boolean().optional(),
    isHistoric: z.boolean().optional(),
    isChannelMeme: z.boolean().optional(),
  })
  .optional();

export const createQuoteCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  enabled: z.boolean().optional(),
});

export const updateQuoteCategorySchema = createQuoteCategorySchema.partial();

export const updateQuotesConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicEnabled: z.boolean().optional(),
  autoCaptureContext: z.boolean().optional(),
});

export const createQuoteSchema = z.object({
  text: z.string().min(1).max(500),
  speakerType: z
    .enum(["streamer", "moderator", "viewer", "guest", "custom"])
    .optional(),
  speakerName: z.string().min(1).max(120),
  speakerTwitchId: z.string().nullable().optional(),
  occurredAt: z.union([z.string(), z.date()]).optional(),
  timezone: z.string().max(80).optional(),
  streamContext: streamContextSchema,
  categoryId: z.string().nullable().optional(),
  tagSlugs: z.array(z.string().min(1).max(80)).optional(),
  markers: markersSchema,
  internalNotes: z.string().max(2000).nullable().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(["active", "archived"]).optional(),
});

export const botCreateQuoteSchema = z.object({
  text: z.string().min(1).max(500),
  speakerName: z.string().max(120).optional(),
  speakerType: z
    .enum(["streamer", "moderator", "viewer", "guest", "custom"])
    .optional(),
  twitchUserId: z.string().min(1),
  twitchUsername: z.string().min(1),
  displayName: z.string().min(1),
  registeredByRole: z.string().optional(),
  streamContext: streamContextSchema,
});

export function formatQuotesZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
