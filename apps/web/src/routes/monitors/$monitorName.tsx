import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod/v4";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";

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
    </main>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { monitorName } = Route.useParams();
  const { period } = Route.useSearch();

  const {
    data: { monitor, stats },
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
          <ItemTitle>{monitor.name}</ItemTitle>
          <ItemDescription>
            <span className="font-semibold">[{monitor.method}]</span>{" "}
            {monitor.url}
          </ItemDescription>
        </ItemContent>
      </Item>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Item variant="outline">
          <ItemContent>
            <ItemDescription>Uptime</ItemDescription>
            <ItemTitle className="text-lg">
              {stats.uptime.toFixed(2)}
              <span className="text-muted-foreground text-sm">%</span>
            </ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemDescription>Fails</ItemDescription>
            <ItemTitle className="text-lg">
              {stats.fails}
              <span className="text-muted-foreground text-sm">#</span>
            </ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemDescription>Total Pings</ItemDescription>
            <ItemTitle className="text-lg">
              {stats.total}
              <span className="text-muted-foreground text-sm">#</span>
            </ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemDescription>P50</ItemDescription>
            <ItemTitle className="text-lg">
              {stats.p50}
              <span className="text-muted-foreground text-sm">ms</span>
            </ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemDescription>P95</ItemDescription>
            <ItemTitle className="text-lg">
              {stats.p95}
              <span className="text-muted-foreground text-sm">ms</span>
            </ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemDescription>P99</ItemDescription>
            <ItemTitle className="text-lg">
              {stats.p99}
              <span className="text-muted-foreground text-sm">ms</span>
            </ItemTitle>
          </ItemContent>
        </Item>
      </div>
    </main>
  );
}
