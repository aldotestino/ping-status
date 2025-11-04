import { oc } from "@orpc/contract";
import { incidentSchema, pingResultSchema } from "@ping-status/db/schema";
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
  .output(
    z.array(monitorSchema.omit({ validator: true, headers: true, body: true }))
  );

const requests = oc
  .route({
    tags: ["monitor"],
    method: "POST",
    path: "/requests",
  })
  .errors({
    NOT_FOUND: {
      message: "Monitor not found",
    },
  })
  .input(
    z.object({
      from: z.int().min(0).optional(),
      to: z.int().min(0).optional(),
      monitorName: z.array(z.string().trim().min(1)).default([]),
      statusCode: z.array(z.enum(["2xx", "4xx", "5xx"])).default([]),
      status: z.array(z.enum(["operational", "degraded", "down"])).default([]),
      incidentId: z.number().min(0).optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(10),
      sort: z
        .object({
          field: z.enum(["createdAt", "responseTime"]).default("createdAt"),
          order: z.enum(["asc", "desc"]).default("desc"),
        })
        .default({ field: "createdAt", order: "desc" }),
    })
  )
  .output(
    z.object({
      requests: z.array(
        pingResultSchema.extend(
          monitorSchema.pick({ url: true, method: true }).shape
        )
      ),
      meta: z.object({
        nextPage: z.number().optional(),
        previousPage: z.number().optional(),
        total: z.number(),
      }),
    })
  );

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
      monitor: monitorSchema.omit({
        validator: true,
        headers: true,
        body: true,
      }),
      pingResults: z.array(
        z.object({
          date: z.iso.datetime(),
          operational: z.number().min(0),
          degraded: z.number().min(0),
          down: z.number().min(0),
        })
      ),
      pingLatencies: z.array(
        z.object({
          date: z.iso.datetime(),
          p95: z.number().min(0),
        })
      ),
      stats: z.object({
        total: z.number().min(0),
        lastTimestamp: z.iso.datetime().nullable(),
        uptime: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
        operational: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
        degraded: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
        down: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
        p50: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
        p95: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
        p99: z.object({
          value: z.number().min(0),
          change: z.number(),
        }),
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
        lastStatus: pingResultSchema.shape.status.optional(),
        successRate: z.number(),
        days: z.array(
          z.object({
            total: z.number(),
            operational: z.number(),
            degraded: z.number(),
            down: z.number(),
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
    path: "/overview",
  })
  .output(
    z.object({
      monitors: z.array(z.string()),
      operational: z.array(z.string()),
      degraded: z.array(z.string()),
      down: z.array(z.string()),
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
  .output(
    z.object({
      incidents: z.array(incidentSchema),
      meta: z.object({
        nextPage: z.number().optional(),
        previousPage: z.number().optional(),
        total: z.number(),
      }),
    })
  );

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
  requests,
};
