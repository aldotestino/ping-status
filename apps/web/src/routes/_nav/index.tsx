import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import MonitorHistory from "@/components/monitor-history";
import MonitorsOverview from "@/components/monitors-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_nav/")({
  component: App,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(orpc.history.queryOptions()),
      queryClient.ensureQueryData(orpc.overview.queryOptions()),
    ]),
  pendingComponent: () => (
    <main className="space-y-6">
      <Skeleton className="h-16" />
      <div className="grid h-12 grid-cols-[repeat(45,1fr)] gap-1">
        {Array.from({ length: 45 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
          (<Skeleton key={index} />)
        ))}
      </div>
      <div className="grid h-12 grid-cols-[repeat(45,1fr)] gap-1">
        {Array.from({ length: 45 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
          (<Skeleton key={index} />)
        ))}
      </div>
    </main>
  ),
});

function App() {
  const { data: history } = useSuspenseQuery(orpc.history.queryOptions());
  const { data: status } = useSuspenseQuery(orpc.overview.queryOptions());

  return (
    <main className="mx-auto max-w-screen-lg space-y-6 px-4 py-10 md:px-6">
      <MonitorsOverview {...status} />
      {history.map((monitor) => (
        <MonitorHistory key={monitor.monitorName} {...monitor} />
      ))}
    </main>
  );
}
