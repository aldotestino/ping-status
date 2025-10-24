import { implement, ORPCError } from "@orpc/server";
import { db } from "@ping-status/db";
import { incident, pingResult } from "@ping-status/db/schema";
import { type Monitor, monitors as monitorsArray } from "@ping-status/monitor";
import { makeBadge } from "badge-maker";
import { eachDayOfInterval, format, subDays } from "date-fns";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  max,
  or,
  sql,
} from "drizzle-orm";
import contract from "./contract";
import { calculatePercentageChange, calculatePercentile } from "./utils";

const router = implement(contract);

const health = router.health.handler(() => ({
  name: "ping-status",
  version: "1.0.0",
  date: new Date().toISOString(),
}));

const monitors = router.monitors.handler(() =>
  monitorsArray.map(({ validator: _, headers: __, body: ___, ...m }) => m)
);

const history = router.history.handler(async () => {
  const now = new Date();
  const startOfPeriod = subDays(now, 44);
  const days = eachDayOfInterval({ start: startOfPeriod, end: now });

  const monitorNames = monitorsArray.map((m) => m.name);

  // Get daily aggregated ping data from database
  const dailyStats = await db
    .select({
      monitorName: pingResult.monitorName,
      day: sql<string>`date(pingResult.createdAt, 'unixepoch')`,
      total: count(),
      operational:
        sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'operational' THEN 1 END)`.mapWith(
          Number
        ),
      degraded:
        sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'degraded' THEN 1 END)`.mapWith(
          Number
        ),
      down: sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'down' THEN 1 END)`.mapWith(
        Number
      ),
    })
    .from(pingResult)
    .where(
      and(
        inArray(pingResult.monitorName, monitorNames),
        gte(pingResult.createdAt, startOfPeriod)
      )
    )
    .groupBy(
      pingResult.monitorName,
      sql`date(${pingResult.createdAt}, 'unixepoch')`
    )
    .orderBy(
      pingResult.monitorName,
      sql`date(${pingResult.createdAt}, 'unixepoch')`
    );

  // Group by monitor
  const statsByMonitor = Object.groupBy(dailyStats, (stat) => stat.monitorName);

  const dailyDowntime = await db
    .select({
      monitorName: incident.monitorName,
      day: sql<string>`date(${incident.openedAt}, "unixepoch")`,
      totalDowntime:
        sql<number>`sum(coalesce(${incident.closedAt}, unixepoch('now')) - ${incident.openedAt})`.mapWith(
          (v) => Math.round(v)
        ),
    })
    .from(incident)
    .where(
      and(
        inArray(incident.monitorName, monitorNames),
        eq(incident.type, "down"),
        gte(incident.openedAt, startOfPeriod)
      )
    )
    .groupBy(
      incident.monitorName,
      sql`date(${incident.openedAt}, "unixepoch")`
    );

  const downtimeByMonitor = Object.groupBy(
    dailyDowntime,
    (downtime) => downtime.monitorName
  );

  const lastStatuses = await db
    .selectDistinct({
      monitorName: pingResult.monitorName,
      status: pingResult.status,
      createdAt: pingResult.createdAt,
    })
    .from(pingResult)
    .where(inArray(pingResult.monitorName, monitorNames))
    .orderBy(pingResult.monitorName, desc(pingResult.createdAt));

  const lastStatusesByMonitor = Object.groupBy(
    lastStatuses,
    (status) => status.monitorName
  );

  // Build the response structure
  const result = monitorNames.map((monitor) => {
    const monitorStats = statsByMonitor[monitor] || [];
    const monitorDowntime = downtimeByMonitor[monitor] || [];
    const [lastStatus] = lastStatusesByMonitor[monitor] || [];

    // Create a map of existing days for quick lookup
    const statsByDay = new Map(monitorStats.map((stat) => [stat.day, stat]));
    const downtimeByDay = new Map(
      monitorDowntime.map((downtime) => [downtime.day, downtime])
    );

    // Fill in all days (including missing ones with 0 data)
    const dayData = days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const stat = statsByDay.get(dayKey);
      const totalDowntime = downtimeByDay.get(dayKey)?.totalDowntime;

      if (stat) {
        return {
          day: day.toISOString(),
          total: stat.total,
          operational: stat.operational,
          degraded: stat.degraded,
          down: stat.down,
          totalDowntime,
        };
      }

      // No data for this day - assume no pings
      return {
        day: day.toISOString(),
        total: 0,
        operational: 0,
        degraded: 0,
        down: 0,
      };
    });

    // Calculate overall success rate
    const totalRequests = dayData.reduce((acc, d) => acc + d.total, 0);
    const totalSuccess = dayData.reduce(
      (acc, d) => acc + d.operational + d.degraded,
      0
    );
    const successRate =
      totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 100;

    return {
      monitorName: monitor,
      successRate,
      days: dayData,
      lastStatus: lastStatus?.status,
    };
  });

  return result;
});

const overview = router.overview.handler(async () => {
  const monitorNames = monitorsArray.map((m) => m.name);

  const openIncidents = await db
    .select({
      monitorName: incident.monitorName,
      type: incident.type,
    })
    .from(incident)
    .where(
      and(
        inArray(incident.monitorName, monitorNames),
        isNull(incident.closedAt)
      )
    );

  const [lastPing] = await db
    .select()
    .from(pingResult)
    .orderBy(desc(pingResult.createdAt))
    .limit(1);

  const lastUpdated =
    lastPing?.createdAt.toISOString() ?? new Date().toISOString();

  const incidentsByType = Object.groupBy(openIncidents, (i) => i.type);

  const down = incidentsByType.down?.map((i) => i.monitorName) ?? [];
  const degraded = incidentsByType.degraded?.map((i) => i.monitorName) ?? [];
  const operational = monitorNames.filter(
    (m) => ![...down, ...degraded].includes(m)
  );

  return {
    monitors: monitorNames,
    operational,
    degraded,
    down,
    lastUpdated,
  };
});

const lastWeekLatencies = router.lastWeekLatencies.handler(async () => {
  const now = new Date();
  const startOfPeriod = subDays(now, 7);

  const monitorNames = monitorsArray.map((m) => m.name);

  const latencies = await db
    .select({
      monitorName: pingResult.monitorName,
      date: sql<string>`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`,
      p95: sql<number>`group_concat(${pingResult.responseTime})`.mapWith((v) =>
        calculatePercentile(v.split(",").map(Number), 95)
      ),
    })
    .from(pingResult)
    .where(
      and(
        inArray(pingResult.monitorName, monitorNames),
        gte(pingResult.createdAt, startOfPeriod)
      )
    )
    .groupBy(
      pingResult.monitorName,
      sql`strftime('%Y-%m-%d %H:00:00', ${pingResult.createdAt}, 'unixepoch')`
    )
    .orderBy(
      pingResult.monitorName,
      sql`strftime('%Y-%m-%d %H:00:00', ${pingResult.createdAt}, 'unixepoch')`
    );

  const latenciesByMonitor = Object.groupBy(latencies, (l) => l.monitorName);

  return monitorsArray.map(({ name, url, method }) => ({
    monitor: {
      name,
      url,
      method,
    },
    latencies:
      latenciesByMonitor[name]?.map((l) => ({
        date: l.date,
        p95: l.p95,
      })) || [],
  }));
});

const incidents = router.incidents.handler(async ({ input, errors }) => {
  const conditionByStatusFilter = {
    all: undefined,
    open: isNull(incident.closedAt),
    closed: isNotNull(incident.closedAt),
  };

  if (
    input.monitorName &&
    !monitorsArray.some((m) => m.name === input.monitorName)
  ) {
    throw errors.NOT_FOUND();
  }

  const statusFilter =
    input.status.length === 1 && input.status[0] ? input.status[0] : "all";

  const where = and(
    input.monitorName
      ? eq(incident.monitorName, input.monitorName)
      : inArray(
          incident.monitorName,
          monitorsArray.map((m) => m.name)
        ),
    conditionByStatusFilter[statusFilter]
  );

  const [t] = await db
    .select({
      count: count(),
    })
    .from(incident)
    .where(where);

  const total = t?.count ?? 0;

  const foundIncidents = await db
    .select()
    .from(incident)
    .where(where)
    .limit(input.limit)
    .offset((input.page - 1) * input.limit)
    .orderBy(
      input.order === "asc" ? asc(incident.openedAt) : desc(incident.openedAt)
    );

  return {
    incidents: foundIncidents,
    meta: {
      nextPage: total > input.page * input.limit ? input.page + 1 : undefined,
      previousPage: input.page - 1 > 0 ? input.page - 1 : undefined,
      total,
    },
  };
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ok
const statusBadge = router.statusBadge.handler(async ({ input, errors }) => {
  if (
    input.monitorName &&
    !monitorsArray.some((m) => m.name === input.monitorName)
  ) {
    throw errors.NOT_FOUND();
  }

  const monitorNames = input.monitorName
    ? [input.monitorName]
    : monitorsArray.map((m) => m.name);

  const [openIncidents] = await db
    .select({
      down: sql<number>`COUNT(CASE WHEN ${incident.type} = 'down' THEN 1 END)`.mapWith(
        Number
      ),
      degraded:
        sql<number>`COUNT(CASE WHEN ${incident.type} = 'degraded' THEN 1 END)`.mapWith(
          Number
        ),
    })
    .from(incident)
    .where(
      and(
        inArray(incident.monitorName, monitorNames),
        isNull(incident.closedAt)
      )
    );

  const down = openIncidents?.down ?? 0;
  const degraded = openIncidents?.degraded ?? 0;

  let message = "";
  if (down > 0) {
    message = input.monitorName
      ? "Downtime"
      : `Downtime (${down}/${monitorsArray.length})`;
  } else if (degraded > 0) {
    message = input.monitorName
      ? "Degraded"
      : `Degraded (${degraded}/${monitorsArray.length})`;
  } else {
    message = "Operational";
  }

  const svg = makeBadge({
    style: "flat",
    message,
    // biome-ignore lint/style/noNestedTernary: ok
    color: down > 0 ? "#EC6041" : degraded > 0 ? "#FFA500" : "#51B363",
    label: input.monitorName ?? "All Systems",
    logoBase64:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDciIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCA0NyAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAuNzUgMzUuOTk5OEwxNC41NzczIDM1Ljk5OThDMTcuMzMwNSAzNS45OTk4IDE5LjkxODQgMzQuNzMxOCAyMS41NDMzIDMyLjU4NjdMMzAuNDQ0MiAyMC44MzY2SDIxLjQzMTdDMjEuNDUxNSAxNy40NjA4IDI0LjMwNjUgMTQuNzMgMjcuODI1NyAxNC43M0wzMC41Mzc0IDE0LjczQzMzLjI0NDQgMTQuNzMgMzUuNzk0NSAxMy41MDM5IDM3LjQyNTIgMTEuNDE4NEw0Ni4zNTk3IC0wLjAwNzgxMjVIMzIuNDc4QzI5LjcyOTEgLTAuMDA3ODEyNSAyNy4xNDQ2IDEuMjU2MzQgMjUuNTE5IDMuMzk2MDRMMC43NSAzNS45OTk4WiIgZmlsbD0iI2ZmZmZmZiIvPgo8cGF0aCBkPSJNMzAuNTYzNyAyMC44MzY2VjM1Ljk5OThINDYuMzU5N1YyOS4xNjU1QzQ2LjM1OTcgMjQuNTY1NiA0Mi40OTYyIDIwLjgzNjYgMzcuNzMwNCAyMC44MzY2SDMwLjU2MzdaIiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo=",
  });

  return {
    headers: {
      "Content-Type": "image/svg+xml",
    },
    body: new File([svg], "badge.svg", { type: "image/svg+xml" }),
  };
});

const monitorDetails = router.monitorDetails.handler(
  async ({ input, errors }) => {
    const found = monitorsArray.find((m) => m.name === input.monitorName);

    if (!found) {
      throw errors.NOT_FOUND();
    }

    const { validator: _, ...monitor } = found;

    const currentFrom = subDays(new Date(), input.period);
    const previousFrom = subDays(currentFrom, input.period);

    const [currentStats] = await db
      .select({
        total: count(),
        operational:
          sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'operational' THEN 1 END)`.mapWith(
            Number
          ),
        degraded:
          sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'degraded' THEN 1 END)`.mapWith(
            Number
          ),
        down: sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'down' THEN 1 END)`.mapWith(
          Number
        ),
        lastTimestamp: max(pingResult.createdAt),
        p50: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 50)
        ),
        p95: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 95)
        ),
        p99: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 99)
        ),
      })
      .from(pingResult)
      .where(
        and(
          gte(pingResult.createdAt, currentFrom),
          eq(pingResult.monitorName, input.monitorName)
        )
      );

    if (!currentStats) {
      throw errors.NOT_FOUND();
    }

    const currentUptime =
      currentStats.total > 0
        ? ((currentStats.operational + currentStats.degraded) /
            currentStats.total) *
          100
        : 0;

    const [previousStats] = await db
      .select({
        total: count(),
        operational:
          sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'operational' THEN 1 END)`.mapWith(
            Number
          ),
        degraded:
          sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'degraded' THEN 1 END)`.mapWith(
            Number
          ),
        down: sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'down' THEN 1 END)`.mapWith(
          Number
        ),
        p50: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 50)
        ),
        p95: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 95)
        ),
        p99: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 99)
        ),
      })
      .from(pingResult)
      .where(
        and(
          gte(pingResult.createdAt, previousFrom),
          lt(pingResult.createdAt, currentFrom),
          eq(pingResult.monitorName, input.monitorName)
        )
      );

    if (!previousStats) {
      throw errors.NOT_FOUND();
    }

    const previousUptime =
      ((previousStats.operational + previousStats.degraded) /
        previousStats.total) *
      100;

    const pingResultsByHour = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`,
        operational:
          sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'operational' THEN 1 END)`.mapWith(
            Number
          ),
        degraded:
          sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'degraded' THEN 1 END)`.mapWith(
            Number
          ),
        down: sql<number>`COUNT(CASE WHEN ${pingResult.status} = 'down' THEN 1 END)`.mapWith(
          Number
        ),
      })
      .from(pingResult)
      .where(
        and(
          gte(pingResult.createdAt, currentFrom),
          eq(pingResult.monitorName, input.monitorName)
        )
      )
      .groupBy(
        sql`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`
      )
      .orderBy(
        sql`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`
      );

    const pingLatenciesByHour = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`,
        p95: sql<number>`group_concat(${pingResult.responseTime})`.mapWith(
          (v) => calculatePercentile(v.split(",").map(Number), 95)
        ),
      })
      .from(pingResult)
      .where(
        and(
          gte(pingResult.createdAt, currentFrom),
          eq(pingResult.monitorName, input.monitorName)
        )
      )
      .groupBy(
        sql`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`
      )
      .orderBy(
        sql`strftime('%Y-%m-%dT%H:00:00.000Z', ${pingResult.createdAt}, 'unixepoch')`
      );

    return {
      monitor,
      pingResults: pingResultsByHour,
      pingLatencies: pingLatenciesByHour,
      stats: {
        total: currentStats.total,
        lastTimestamp: currentStats.lastTimestamp?.toISOString() ?? null,
        uptime: {
          value: currentUptime,
          change: calculatePercentageChange(currentUptime, previousUptime),
        },
        operational: {
          value: currentStats.operational,
          change: calculatePercentageChange(
            currentStats.operational,
            previousStats.operational
          ),
        },
        degraded: {
          value: currentStats.degraded,
          change: calculatePercentageChange(
            currentStats.degraded,
            previousStats.degraded
          ),
        },
        down: {
          value: currentStats.down,
          change: calculatePercentageChange(
            currentStats.down,
            previousStats.down
          ),
        },
        p50: {
          value: currentStats.p50 ?? 0,
          change: calculatePercentageChange(
            currentStats.p50,
            previousStats.p50
          ),
        },
        p95: {
          value: currentStats.p95 ?? 0,
          change: calculatePercentageChange(
            currentStats.p95,
            previousStats.p95
          ),
        },
        p99: {
          value: currentStats.p99 ?? 0,
          change: calculatePercentageChange(
            currentStats.p99,
            previousStats.p99
          ),
        },
      },
    };
  }
);

export const requests = router.requests.handler(async ({ input, errors }) => {
  const sortBy = {
    "createdAt.asc": asc(pingResult.createdAt),
    "createdAt.desc": desc(pingResult.createdAt),
    "responseTime.asc": asc(pingResult.responseTime),
    "responseTime.desc": desc(pingResult.responseTime),
  };

  const monitorNames = monitorsArray.map((m) => m.name);

  if (
    input.monitorName.length > 0 &&
    input.monitorName.some((m1) => !monitorNames.includes(m1))
  ) {
    throw errors.NOT_FOUND();
  }

  const monitorNameCondition =
    input.monitorName.length > 0
      ? inArray(pingResult.monitorName, input.monitorName)
      : inArray(pingResult.monitorName, monitorNames);

  const statusCodeConditions = {
    "2xx": and(gte(pingResult.statusCode, 200), lt(pingResult.statusCode, 300)),
    "4xx": and(gte(pingResult.statusCode, 400), lt(pingResult.statusCode, 500)),
    "5xx": and(gte(pingResult.statusCode, 500), lt(pingResult.statusCode, 600)),
  };

  const statusConditions = {
    operational: eq(pingResult.status, "operational"),
    degraded: eq(pingResult.status, "degraded"),
    down: eq(pingResult.status, "down"),
  };

  const statusCodeCondition = or(
    ...input.statusCode.map((s) => statusCodeConditions[s])
  );
  const statusCondition = or(...input.status.map((s) => statusConditions[s]));

  const incidentIdCondition = input.incidentId
    ? eq(pingResult.incidentId, input.incidentId)
    : undefined;

  const fromCondition = input.from
    ? gte(pingResult.createdAt, new Date(input.from))
    : undefined;

  const toCondition = input.to
    ? lt(pingResult.createdAt, new Date(input.to))
    : undefined;

  const where = and(
    monitorNameCondition,
    statusCodeCondition,
    statusCondition,
    incidentIdCondition,
    fromCondition,
    toCondition
  );

  const [t] = await db
    .select({
      count: count(),
    })
    .from(pingResult)
    .where(where);

  const total = t?.count ?? 0;

  const pings = await db
    .select()
    .from(pingResult)
    .where(where)
    .limit(input.limit)
    .offset((input.page - 1) * input.limit)
    .orderBy(sortBy[`${input.sort.field}.${input.sort.order}`]);

  const monitorByName = monitorsArray.reduce(
    (acc, m) => {
      acc[m.name] = {
        url: m.url,
        method: m.method,
      };

      return acc;
    },
    {} as Record<string, Pick<Monitor, "url" | "method">>
  );

  const formattedRequests = pings.map((ping) => {
    const m = monitorByName[ping.monitorName];

    if (!m) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return {
      ...ping,
      ...m,
    };
  });

  return {
    requests: formattedRequests,
    meta: {
      nextPage: total > input.page * input.limit ? input.page + 1 : undefined,
      previousPage: input.page - 1 > 0 ? input.page - 1 : undefined,
      total,
    },
  };
});

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
