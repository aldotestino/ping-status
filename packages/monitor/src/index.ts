import { z } from "zod/v4";

const MIN_STATUS_CODE = 100;
const MAX_STATUS_CODE = 599;

const MIN_TIMEOUT = 1000; // 1 second
const MAX_TIMEOUT = 60_000; // 1 minute
const DEFAULT_TIMEOUT = 20_000; // 20 seconds

const MIN_DEGRADED_THRESHOLD = 10; // 10 ms
const MAX_DEGRADED_THRESHOLD = MAX_TIMEOUT; // 1 minute

export const monitorSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  method: z.enum(["GET", "POST", "PUT"]).default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.union([z.record(z.string(), z.any()), z.string()]).optional(),
  timeout: z
    .number()
    .min(MIN_TIMEOUT)
    .max(MAX_TIMEOUT)
    .default(DEFAULT_TIMEOUT),
  degradedThreshold: z
    .number()
    .min(MIN_DEGRADED_THRESHOLD)
    .max(MAX_DEGRADED_THRESHOLD)
    .optional(),
  maxRetries: z.number().min(0).max(5).default(2),
  retryDelay: z.number().min(100).max(3000).default(1000),
  validator: z.function({
    input: [
      z.object({
        status: z.number().min(MIN_STATUS_CODE).max(MAX_STATUS_CODE),
        body: z.string(),
        headers: z.record(z.string(), z.string()),
      }),
    ],
    output: z.discriminatedUnion("success", [
      z.object({
        success: z.literal(true),
      }),
      z.object({
        success: z.literal(false),
        message: z.string(),
      }),
    ]),
  }),
});

type MonitorConfig = z.input<typeof monitorSchema>;

export type Monitor = z.infer<typeof monitorSchema>;

export const monitor = (config: MonitorConfig): Monitor => {
  return monitorSchema.parse(config);
};
