import { implement } from "@orpc/server";
import { db } from "@ping-status/db";
import { pingResult } from "@ping-status/db/schema";
import { monitors as monitorsArray } from "@ping-status/monitor";
import { eachDayOfInterval, format, subDays } from "date-fns";
import { and, count, gte, inArray, sql } from "drizzle-orm";
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

const status = router.status.handler(async () => {
  const now = new Date();
  const startOfPeriod = subDays(now, 44);
  const days = eachDayOfInterval({ start: startOfPeriod, end: now });

  const ms = monitorsArray.map(({ validator: _, ...m }) => m);

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
        inArray(
          pingResult.monitorName,
          ms.map((m) => m.name)
        ),
        gte(pingResult.createdAt, startOfPeriod)
      )
    )
    .groupBy(pingResult.monitorName, sql`DATE(${pingResult.createdAt})`)
    .orderBy(pingResult.monitorName, sql`DATE(${pingResult.createdAt})`);

  // Group by monitor
  const statsByMonitor = Object.groupBy(dailyStats, (stat) => stat.monitorName);

  // Build the response structure
  const result = ms.map((monitor) => {
    const monitorStats = statsByMonitor[monitor.name] || [];

    // Create a map of existing days for quick lookup
    const statsByDay = new Map(monitorStats.map((stat) => [stat.day, stat]));

    // Fill in all days (including missing ones with 0 data)
    const dayData = days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const stat = statsByDay.get(dayKey);

      if (stat) {
        return {
          day: day.toISOString(),
          total: stat.total,
          success: stat.success,
          fail: stat.fail,
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
      monitor,
      successRate,
      days: dayData,
    };
  });

  return result;
});

export default {
  health,
  monitors,
  status,
};
