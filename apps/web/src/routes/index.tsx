import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import MonitorStatus from "@/components/monitor-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <main className="space-y-6">
      <Alert variant="green">
        <CheckCircle />
        <AlertTitle>All Systems Operational</AlertTitle>
        <AlertDescription className="text-zinc-500">
          {format(new Date(), "MMM d, yyyy HH:mm")}
        </AlertDescription>
      </Alert>
      <MonitorStatus />
      <MonitorStatus />
    </main>
  );
}
