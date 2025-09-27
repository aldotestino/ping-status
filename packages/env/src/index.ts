import { z } from "zod";

const envSchema = z.object({
  DATABASE_FILENAME: z.string(),
  MONITOR_INTERVAL_SECONDS: z.coerce.number().default(120),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  DATABASE_FILENAME: process.env.DATABASE_FILENAME,
  MONITOR_INTERVAL_SECONDS: process.env.MONITOR_INTERVAL_SECONDS,
});
