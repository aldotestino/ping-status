import { z } from "zod/v4";

const MIN_STATUS_CODE = 100;
const MAX_STATUS_CODE = 599;

const SUCCESS_STATUS_CODE = 200;

export const monitorSchema = z.object({
  id: z.int(),
  name: z.string().min(1),
  url: z.url(),
  method: z.enum(["GET", "POST", "PUT"]).default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.union([z.record(z.string(), z.any()), z.string()]).optional(),
  validator: z.function({
    input: [
      z.object({
        status: z.number().min(MIN_STATUS_CODE).max(MAX_STATUS_CODE),
        body: z.string(),
        headers: z.record(z.string(), z.string()),
      }),
    ],
    output: z.object({
      success: z.boolean(),
      message: z.string().optional(),
    }),
  }),
});

type MonitorConfig = z.input<typeof monitorSchema>;

export type Monitor = z.infer<typeof monitorSchema>;

const monitor = (config: MonitorConfig): Monitor => {
  return monitorSchema.parse(config);
};

export const monitors = [
  monitor({
    id: 1,
    name: "example-monitor",
    url: "https://example.com",
    validator: ({ status }) => ({
      success: status === SUCCESS_STATUS_CODE,
    }),
  }),
];
