import { implement } from "@orpc/server";
import { db } from "@ping-status/db";
import { incident, pingResult } from "@ping-status/db/schema";
import { monitors as monitorsArray } from "@ping-status/monitor";
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
  sql,
} from "drizzle-orm";
import contract from "@/contract";

const router = implement(contract);

const health = router.health.handler(() => ({
  name: "ping-status",
  version: "1.0.0",
  date: new Date().toISOString(),
}));

const monitors = router.monitors.handler(() =>
  monitorsArray.map(({ validator: _, ...m }) => m)
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
      day: sql<string>`DATE(${pingResult.createdAt})`,
      total: count(),
      success:
        sql<number>`COUNT(CASE WHEN ${pingResult.success} = true THEN 1 END)`.mapWith(
          Number
        ),
      fail: sql<number>`COUNT(CASE WHEN ${pingResult.success} = false THEN 1 END)`.mapWith(
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
    .groupBy(pingResult.monitorName, sql`DATE(${pingResult.createdAt})`)
    .orderBy(pingResult.monitorName, sql`DATE(${pingResult.createdAt})`);

  // Group by monitor
  const statsByMonitor = Object.groupBy(dailyStats, (stat) => stat.monitorName);

  const dailyDowntime = await db
    .select({
      monitorName: incident.monitorName,
      day: sql<string>`DATE(${incident.openedAt})`,
      totalDowntime:
        sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(${incident.closedAt}, NOW()) - ${incident.openedAt})))`.mapWith(
          (v) => Math.round(v)
        ),
    })
    .from(incident)
    .where(
      and(
        inArray(incident.monitorName, monitorNames),
        gte(incident.openedAt, startOfPeriod)
      )
    )
    .groupBy(incident.monitorName, sql`DATE(${incident.openedAt})`);

  const downtimeByMonitor = Object.groupBy(
    dailyDowntime,
    (downtime) => downtime.monitorName
  );

  // Build the response structure
  const result = monitorNames.map((monitor) => {
    const monitorStats = statsByMonitor[monitor] || [];
    const monitorDowntime = downtimeByMonitor[monitor] || [];

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
          success: stat.success,
          fail: stat.fail,
          totalDowntime,
        };
      }

      // No data for this day - assume no pings
      return {
        day: day.toISOString(),
        total: 0,
        success: 0,
        fail: 0,
      };
    });

    // Calculate overall success rate
    const totalRequests = dayData.reduce((acc, d) => acc + d.total, 0);
    const totalSuccess = dayData.reduce((acc, d) => acc + d.success, 0);
    const successRate =
      totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 100;

    return {
      monitorName: monitor,
      successRate,
      days: dayData,
    };
  });

  return result;
});

const overview = router.overview.handler(async () => {
  const [openIncidents] = await db
    .select({
      count: count(),
    })
    .from(incident)
    .where(
      and(
        inArray(
          incident.monitorName,
          monitorsArray.map((m) => m.name)
        ),
        isNull(incident.closedAt)
      )
    );

  const down = openIncidents?.count ?? 0;

  const [lastPing] = await db
    .select()
    .from(pingResult)
    .orderBy(desc(pingResult.createdAt))
    .limit(1);

  const lastUpdated =
    lastPing?.createdAt.toISOString() ?? new Date().toISOString();

  return {
    total: monitorsArray.length,
    operational: monitorsArray.length - down,
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
      date: sql`DATE_TRUNC('hour', ${pingResult.createdAt}) AT TIME ZONE 'UTC'`.mapWith(
        (v) => new Date(v).toISOString()
      ),
      p95: sql`percentile_cont(0.95) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
        (v) => Math.round(v)
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
      sql`DATE_TRUNC('hour', ${pingResult.createdAt})`
    )
    .orderBy(
      pingResult.monitorName,
      sql`DATE_TRUNC('hour', ${pingResult.createdAt})`
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

const incidents = router.incidents.handler(({ input, errors }) => {
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

  return db
    .select()
    .from(incident)
    .where(
      and(
        input.monitorName
          ? eq(incident.monitorName, input.monitorName)
          : inArray(
              incident.monitorName,
              monitorsArray.map((m) => m.name)
            ),
        conditionByStatusFilter[statusFilter]
      )
    )
    .limit(input.limit)
    .offset((input.page - 1) * input.limit)
    .orderBy(
      input.order === "asc" ? asc(incident.openedAt) : desc(incident.openedAt)
    );
});

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
      count: count(),
    })
    .from(incident)
    .where(
      and(
        inArray(incident.monitorName, monitorNames),
        isNull(incident.closedAt)
      )
    );

  const down = openIncidents?.count ?? 0;

  const svg = makeBadge({
    style: "flat",
    message:
      down > 0
        ? // biome-ignore lint/style/noNestedTernary: ok
          input.monitorName
          ? "Downtime"
          : `Downtime (${down}/${monitorsArray.length})`
        : "Operational",
    color: down ? "#EC6041" : "#51B363",
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

function calculatePercentageChange(current: number, previous: number) {
  if (!previous || previous === 0) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}

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
        success:
          sql<number>`COUNT(CASE WHEN ${pingResult.success} = true THEN 1 END)`.mapWith(
            Number
          ),
        fails:
          sql<number>`COUNT(CASE WHEN ${pingResult.success} = false THEN 1 END)`.mapWith(
            Number
          ),
        lastTimestamp: max(pingResult.createdAt),
        p50: sql`percentile_cont(0.50) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
        ),
        p95: sql`percentile_cont(0.95) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
        ),
        p99: sql`percentile_cont(0.99) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
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

    const currentUptime = (currentStats.success / currentStats.total) * 100;

    const [previousStats] = await db
      .select({
        total: count(),
        success:
          sql<number>`COUNT(CASE WHEN ${pingResult.success} = true THEN 1 END)`.mapWith(
            Number
          ),
        fails:
          sql<number>`COUNT(CASE WHEN ${pingResult.success} = false THEN 1 END)`.mapWith(
            Number
          ),
        p50: sql`percentile_cont(0.50) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
        ),
        p95: sql`percentile_cont(0.95) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
        ),
        p99: sql`percentile_cont(0.99) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
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

    const previousUptime = (previousStats.success / previousStats.total) * 100;

    const pingResultsByHour = await db
      .select({
        date: sql`DATE_TRUNC('hour', ${pingResult.createdAt}) AT TIME ZONE 'UTC'`.mapWith(
          (v) => new Date(v).toISOString()
        ),
        success:
          sql<number>`COUNT(CASE WHEN ${pingResult.success} = true THEN 1 END)`.mapWith(
            Number
          ),
        fail: sql<number>`COUNT(CASE WHEN ${pingResult.success} = false THEN 1 END)`.mapWith(
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
      .groupBy(sql`DATE_TRUNC('hour', ${pingResult.createdAt})`)
      .orderBy(sql`DATE_TRUNC('hour', ${pingResult.createdAt})`);

    const pingLatenciesByHour = await db
      .select({
        date: sql`DATE_TRUNC('hour', ${pingResult.createdAt}) AT TIME ZONE 'UTC'`.mapWith(
          (v) => new Date(v).toISOString()
        ),
        p95: sql`percentile_cont(0.95) WITHIN GROUP (ORDER BY ${pingResult.responseTime})`.mapWith(
          (v) => Math.round(v)
        ),
      })
      .from(pingResult)
      .where(
        and(
          gte(pingResult.createdAt, currentFrom),
          eq(pingResult.monitorName, input.monitorName)
        )
      )
      .groupBy(sql`DATE_TRUNC('hour', ${pingResult.createdAt})`)
      .orderBy(sql`DATE_TRUNC('hour', ${pingResult.createdAt})`);

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
        success: {
          value: currentStats.success,
          change: calculatePercentageChange(
            currentStats.success,
            previousStats.success
          ),
        },
        fails: {
          value: currentStats.fails,
          change: calculatePercentageChange(
            currentStats.fails,
            previousStats.fails
          ),
        },
        p50: {
          value: currentStats.p50,
          change: calculatePercentageChange(
            currentStats.p50,
            previousStats.p50
          ),
        },
        p95: {
          value: currentStats.p95,
          change: calculatePercentageChange(
            currentStats.p95,
            previousStats.p95
          ),
        },
        p99: {
          value: currentStats.p99,
          change: calculatePercentageChange(
            currentStats.p99,
            previousStats.p99
          ),
        },
      },
    };
  }
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
