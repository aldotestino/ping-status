import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { z } from "zod/v4";
import CopyButton from "@/components/copy-button";
import MonitorStat from "@/components/monitor-stat";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { getStatusBadge } from "@/lib/utils";

export const Route = createFileRoute("/monitors/$monitorName")({
  validateSearch: z.object({
    period: z.coerce.number().min(1).max(30).default(7),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        period: 7,
      }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps, params }) =>
    queryClient.ensureQueryData(
      orpc.monitorDetails.queryOptions({
        input: {
          monitorName: params.monitorName,
          period: deps.period,
        },
      })
    ),
  pendingComponent: () => (
    <main className="space-y-6">
      <Skeleton className="h-16" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </main>
  ),
  component: RouteComponent,
});

const pingResultsChartConfig = {
  success: {
    label: "Success",
    color: "var(--monitor-status-operational)",
  },
  fail: {
    label: "Fail",
    color: "var(--monitor-status-down)",
  },
} satisfies ChartConfig;

const pingLatenciesChartConfig = {
  p95: {
    label: "p95",
    color: "var(--monitor-status-operational)",
  },
} satisfies ChartConfig;

function RouteComponent() {
  const { monitorName } = Route.useParams();
  const { period } = Route.useSearch();

  const {
    data: { monitor, stats, pingResults, pingLatencies },
  } = useSuspenseQuery(
    orpc.monitorDetails.queryOptions({
      input: {
        monitorName,
        period,
      },
    })
  );

  return (
    <main className="space-y-6">
      <Item className="p-0">
        <ItemContent>
          <ItemTitle className="text-base">{monitor.name}</ItemTitle>
          <ItemDescription>
            <span className="font-semibold">[{monitor.method}]</span>{" "}
            {monitor.url}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <CopyButton value={getStatusBadge(monitor.name)} variant="outline">
            Get Status Badge
          </CopyButton>
        </ItemActions>
      </Item>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <MonitorStat
          change={stats.uptime.change}
          name="Uptime"
          positiveChangeIsGood
          unit="%"
          value={stats.uptime.value.toFixed(2)}
        />
        <MonitorStat
          change={stats.fails.change}
          name="Fails"
          unit="#"
          value={stats.fails.value}
        />
        <MonitorStat name="Total Pings" unit="#" value={stats.total} />
        <MonitorStat
          change={stats.p50.change}
          name="p50"
          unit="ms"
          value={stats.p50.value}
        />
        <MonitorStat
          change={stats.p95.change}
          name="p95"
          unit="ms"
          value={stats.p95.value}
        />
        <MonitorStat
          change={stats.p99.change}
          name="p99"
          unit="ms"
          value={stats.p99.value}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground">Ping results by hour</p>
        <ChartContainer className="h-32 w-full" config={pingResultsChartConfig}>
          <BarChart accessibilityLayer data={pingResults}>
            <XAxis dataKey="date" hide />
            <CartesianGrid vertical={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(date) => format(date, "MMM d, HH:mm")}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="success"
              fill="var(--monitor-status-operational)"
              stackId="a"
            />
            <Bar dataKey="fail" fill="var(--monitor-status-down)" stackId="a" />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground">Ping latencies by hour</p>
        <ChartContainer
          className="h-32 w-full"
          config={pingLatenciesChartConfig}
        >
          <LineChart accessibilityLayer data={pingLatencies}>
            <XAxis dataKey="date" hide />
            <CartesianGrid vertical={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(date) => format(date, "MMM d, HH:mm")}
                />
              }
            />
            <Line
              dataKey="p95"
              dot={false}
              stroke="var(--monitor-status-operational)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </div>
    </main>
  );
}
