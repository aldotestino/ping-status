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

const monitorDetails = oc
  .route({
    tags: ["monitor"],
    method: "POST",
    path: "/monitors/{monitorName}",
  })
  .errors({
    NOT_FOUND: {
      message: "Monitor not found",
    },
  })
  .input(
    z.object({
      monitorName: z.string().trim().min(1),
      period: z.number().min(1).max(30).default(7),
    })
  )
  .output(
    z.object({
      monitor: monitorSchema.omit({ validator: true }),
      stats: z.object({
        total: z.number().min(0),
        uptime: z.number().min(0).max(100),
        fails: z.number().min(0),
        success: z.number().min(0),
        lastTimestamp: z.iso.datetime().nullable(),
        p50: z.number().min(0),
        p95: z.number().min(0),
        p99: z.number().min(0),
      }),
    })
  );

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
    method: "POST",
    path: "/incidents",
  })
  .errors({
    NOT_FOUND: {
      message: "Monitor not found",
    },
  })
  .input(
    z.object({
      status: z
        .array(z.enum(["open", "closed"]))
        .max(2)
        .default([])
        .transform((arr) => Array.from(new Set(arr))),
      monitorName: z.string().trim().min(1).optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(10),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
  )
  .output(z.array(incidentSchema));

const statusBadge = oc
  .route({
    tags: ["monitor"],
    method: "GET",
    path: "/status-badge",
    outputStructure: "detailed",
  })
  .errors({
    NOT_FOUND: {
      message: "Monitor not found",
    },
  })
  .input(
    z.object({
      monitorName: z.string().trim().min(1).optional(),
    })
  )
  .output(
    z.object({
      headers: z.object({
        "Content-Type": z.literal("image/svg+xml"),
      }),
      body: z.file(),
    })
  );

export default {
  health,
  monitors,
  history,
  overview,
  lastWeekLatencies,
  incidents,
  statusBadge,
  monitorDetails,
};
