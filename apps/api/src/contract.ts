import { oc } from "@orpc/contract";
import { incidentSchema } from "@ping-status/db/schema";
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
    path: "/history",
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
            totalDowntime: z.number().optional(),
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

const lastWeekLatencies = oc
  .route({
    tags: ["monitor"],
    method: "GET",
    path: "/last-week-latencies",
  })
  .output(
    z.array(
      z.object({
        monitor: monitorSchema.pick({ name: true, url: true, method: true }),
        latencies: z.array(
          z.object({ date: z.iso.datetime(), p95: z.number() })
        ),
      })
    )
  );

const incidents = oc
  .route({
    tags: ["monitor"],
    method: "GET",
    path: "/incidents",
  })
  .input(
    z.object({
      status: z.enum(["open", "closed", "all"]).default("open"),
      monitorName: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(10),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
  )
  .output(z.array(incidentSchema));

export default {
  health,
  monitors,
  history,
  overview,
  lastWeekLatencies,
  incidents,
};
