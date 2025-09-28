import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/monitors")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(orpc.lastWeekLatencies.queryOptions()),
});

const chartConfig = {
  max: {
    label: "Max",
    color: "var(--chart-1)",
  },
  avg: {
    label: "Avg",
    color: "var(--chart-2)",
  },
  min: {
    label: "Min",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function RouteComponent() {
  const { data: lastWeekLatencies } = useSuspenseQuery(
    orpc.lastWeekLatencies.queryOptions()
  );

  return (
    <main className="space-y-6">
      <p className="text-muted-foreground">
        <span className="font-semibold text-chart-1">Max</span>,{" "}
        <span className="font-semibold text-chart-2">Avg</span>, and{" "}
        <span className="font-semibold text-chart-3">Min</span> latencies over
        the <span className="font-semibold text-foreground">last 7 days</span>.
      </p>
      {lastWeekLatencies.map(({ monitor, latencies }) => (
        <div className="space-y-2" key={monitor.name}>
          <div className="flex justify-between">
            <div className="space-y-0.5">
              <p className="font-semibold">{monitor.name}</p>
              <p className="text-muted-foreground text-sm">
                <span className="font-mono font-semibold">
                  [{monitor.method}]
                </span>{" "}
                {monitor.url}
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to={"/"}>
                Details
                <ChevronRight />
              </Link>
            </Button>
          </div>
          <ChartContainer className="h-32 w-full" config={chartConfig}>
            <LineChart accessibilityLayer data={latencies}>
              <XAxis dataKey="date" hide />
              <CartesianGrid vertical={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(date) => format(date, "MMM d, HH:mm")}
                    valueFormatter={(value) => (
                      <div className="space-x-0.5">
                        <span>{Math.round(value)}</span>
                        <span className="text-muted-foreground text-xs">
                          ms
                        </span>
                      </div>
                    )}
                  />
                }
                cursor={false}
              />
              <Line
                dataKey="max"
                dot={false}
                stroke="var(--chart-1)"
                type="natural"
              />
              <Line
                dataKey="avg"
                dot={false}
                stroke="var(--chart-2)"
                type="natural"
              />
              <Line
                dataKey="min"
                dot={false}
                stroke="var(--chart-3)"
                type="natural"
              />
            </LineChart>
          </ChartContainer>
        </div>
      ))}
    </main>
  );
}
