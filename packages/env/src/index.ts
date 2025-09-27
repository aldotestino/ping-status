import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  MONITOR_INTERVAL_SECONDS: z.coerce.number().default(120),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  MONITOR_INTERVAL_SECONDS: process.env.MONITOR_INTERVAL_SECONDS,
});
