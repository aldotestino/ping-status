import { z } from "zod";

const envSchema = z.object({
  MONITOR_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(120).default(1),
  MONITOR_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(5),
  SLACK_WEBHOOK_URL: z.url().optional(),
  DATABASE_PATH: z.string().default("../../ping-status.db"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  MONITOR_INTERVAL_MINUTES: process.env.MONITOR_INTERVAL_MINUTES,
  MONITOR_CONCURRENCY: process.env.MONITOR_CONCURRENCY,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  DATABASE_PATH: process.env.DATABASE_PATH,
});
