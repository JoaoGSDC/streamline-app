import { z, type ZodIssue } from "zod";

export function formatZodErrorMessages(error: z.ZodError): string {
  return error.issues.map((issue: ZodIssue) => issue.message).join("; ");
}

const triggerRegex = /^!?[a-z0-9_]{2,32}$/i;

export const createBotCommandSchema = z.object({
  trigger: z
    .string()
    .min(2, "Trigger deve ter pelo menos 2 caracteres")
    .max(33, "Trigger muito longo")
    .refine(
      (value) => triggerRegex.test(value.replace(/\s/g, "")),
      "Use apenas letras, números e underscore (sem espaços)"
    ),
  response: z
    .string()
    .min(1, "Resposta é obrigatória")
    .max(500, "Resposta deve ter no máximo 500 caracteres"),
  cooldownSeconds: z.coerce.number().int().min(0).max(3600).optional().default(0),
  enabled: z.boolean().optional().default(true),
});

export const updateBotCommandSchema = createBotCommandSchema.partial();

export const createBotTimerSchema = z.object({
  name: z.string().max(64).optional().nullable(),
  intervalMinutes: z.coerce.number().int().min(1).max(120),
  message: z.string().min(1).max(500),
  enabled: z.boolean().optional().default(true),
});

export const updateBotTimerSchema = createBotTimerSchema.partial();

const botBlacklistBaseSchema = z.object({
  term: z.string().min(1).max(100),
  matchType: z.enum(["exact", "contains"]).default("contains"),
  action: z.enum(["delete", "timeout"]).default("delete"),
  timeoutSeconds: z.coerce.number().int().min(1).max(1209600).optional(),
  enabled: z.boolean().optional().default(true),
});

function refineBlacklistTimeout<
  T extends z.ZodTypeAny,
>(schema: T) {
  return schema.superRefine(
    (
      data: {
        action?: "delete" | "timeout";
        timeoutSeconds?: number;
      },
      ctx: z.RefinementCtx
    ) => {
      if (data.action === "timeout" && !data.timeoutSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a duração do timeout em segundos",
          path: ["timeoutSeconds"],
        });
      }
    }
  );
}

export const createBotBlacklistSchema =
  refineBlacklistTimeout(botBlacklistBaseSchema);

export const updateBotBlacklistSchema = refineBlacklistTimeout(
  botBlacklistBaseSchema.partial()
);

export const BOT_VARIABLES = [
  { key: "{user}", description: "Login do usuário que acionou o comando" },
  { key: "{displayName}", description: "Nome exibido no chat" },
  { key: "{channel}", description: "Nome do canal Twitch" },
  {
    key: "{count:<nome>}",
    description: "Valor de um contador (ex.: {count:vitorias})",
  },
] as const;
