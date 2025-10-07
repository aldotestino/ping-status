import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  MONITOR_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(120).default(1),
  MONITOR_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  MONITOR_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(3000)
    .default(1000),
  MONITOR_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(20_000)
    .default(10_000),
  MONITOR_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(5),
  SLACK_WEBHOOK_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  MONITOR_INTERVAL_MINUTES: process.env.MONITOR_INTERVAL_MINUTES,
  MONITOR_RETRIES: process.env.MONITOR_RETRIES,
  MONITOR_RETRY_DELAY_MS: process.env.MONITOR_RETRY_DELAY_MS,
  MONITOR_TIMEOUT_MS: process.env.MONITOR_TIMEOUT_MS,
  MONITOR_CONCURRENCY: process.env.MONITOR_CONCURRENCY,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
});
