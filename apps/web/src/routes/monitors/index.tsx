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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/monitors/")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(orpc.lastWeekLatencies.queryOptions()),
});

const chartConfig = {
  p95: {
    label: "p95",
    color: "var(--monitor-status-operational)",
  },
} satisfies ChartConfig;

function RouteComponent() {
  const { data: lastWeekLatencies } = useSuspenseQuery(
    orpc.lastWeekLatencies.queryOptions()
  );

  return (
    <main className="space-y-6">
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">p95</span> latencies
        over the{" "}
        <span className="font-semibold text-foreground">last 7 days</span>.
      </p>
      {lastWeekLatencies.map(({ monitor, latencies }) => (
        <div className="space-y-2" key={monitor.name}>
          <Item className="p-0">
            <ItemContent>
              <ItemTitle>{monitor.name}</ItemTitle>
              <ItemDescription>
                <span className="font-semibold">[{monitor.method}]</span>
                {monitor.url}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button asChild variant="ghost">
                <Link
                  params={{ monitorName: monitor.name }}
                  to="/monitors/$monitorName"
                >
                  Details
                  <ChevronRight />
                </Link>
              </Button>
            </ItemActions>
          </Item>
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
                dataKey="p95"
                dot={false}
                stroke="var(--monitor-status-operational)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </div>
      ))}
    </main>
  );
}
