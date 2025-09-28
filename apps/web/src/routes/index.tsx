import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import MonitorHistory from "@/components/monitor-history";
import MonitorsOverview from "@/components/monitors-overview";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/")({
  component: App,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(orpc.history.queryOptions()),
      queryClient.ensureQueryData(orpc.overview.queryOptions()),
    ]),
});

function App() {
  const { data: history } = useSuspenseQuery(orpc.history.queryOptions());
  const { data: status } = useSuspenseQuery(orpc.overview.queryOptions());

  return (
    <main className="space-y-6">
      <MonitorsOverview {...status} />
      {history.map((monitor) => (
        <MonitorHistory key={monitor.monitorName} {...monitor} />
      ))}
    </main>
  );
}
