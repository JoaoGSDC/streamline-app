import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./local.db",
  },
} satisfies Config;
