import { oc } from "@orpc/contract";
import { monitorSchema } from "@ping-status/monitor";
import { z } from "zod";

const health = oc
  .route({
    tags: ["health"],
    method: "GET",
    path: "/health",
  })
  .output(
    z.object({
      name: z.literal("ping-status"),
      version: z.string(),
      date: z.iso.datetime(),
    })
  );

const monitors = oc
  .route({
    tags: ["monitor"],
    method: "GET",
    path: "/monitors",
  })
  .output(z.array(monitorSchema.omit({ validator: true })));

const history = oc
  .route({
    tags: ["monitor"],
    method: "GET",
    path: "/overview",
  })
  .output(
    z.array(
      z.object({
        monitorName: monitorSchema.shape.name,
        successRate: z.number(),
        days: z.array(
          z.object({
            total: z.number(),
            success: z.number(),
            fail: z.number(),
            day: z.iso.datetime(),
          })
        ),
      })
    )
  );

const overview = oc
  .route({
    tags: ["monitor"],
    method: "GET",
    path: "/status",
  })
  .output(
    z.object({
      total: z.number(),
      operational: z.number(),
      down: z.number(),
      lastUpdated: z.iso.datetime(),
    })
  );

export default {
  health,
  monitors,
  history,
  overview,
};
