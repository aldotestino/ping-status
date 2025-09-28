import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import MonitorStatus from "@/components/monitor-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/")({
  component: App,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(orpc.history.queryOptions()),
});

function App() {
  const { data } = useSuspenseQuery(orpc.history.queryOptions());

  return (
    <main className="space-y-6">
      <Alert variant="green">
        <CheckCircle />
        <AlertTitle>All Systems Operational</AlertTitle>
        <AlertDescription className="text-zinc-500">
          {format(new Date(), "MMM d, yyyy HH:mm")}
        </AlertDescription>
      </Alert>
      {data.map((monitor) => (
        <MonitorStatus key={monitor.monitorName} {...monitor} />
      ))}
    </main>
  );
}
