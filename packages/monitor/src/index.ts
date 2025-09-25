import { z } from "zod/v4";

const MIN_STATUS_CODE = 100;
const MAX_STATUS_CODE = 599;

const monitorSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  method: z.enum(["GET", "POST", "PUT"]).default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.any()).optional(),
  validator: z.function({
    input: [
      z.object({
        status: z.number().min(MIN_STATUS_CODE).max(MAX_STATUS_CODE),
        body: z.string(),
        headers: z.record(z.string(), z.string()),
      }),
    ],
    output: z.boolean(),
  }),
});

type MonitorConfig = z.input<typeof monitorSchema>;

export const monitor = (config: MonitorConfig) => {
  return monitorSchema.parse(config);
};
