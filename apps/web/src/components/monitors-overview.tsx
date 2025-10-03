import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { client } from "@/lib/orpc";

type MonitorsOverviewProps = Awaited<ReturnType<typeof client.overview>>;

function MonitorsOverview({ down, total, lastUpdated }: MonitorsOverviewProps) {
  if (down >= 1) {
    return (
      <Alert className="border-monitor-status-down/40 bg-monitor-status-down/20 text-monitor-status-down">
        <AlertCircle />
        <AlertTitle>
          Downtime ({down}/{total})
        </AlertTitle>
        <AlertDescription>
          Last Updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-monitor-status-operational/40 bg-monitor-status-operational/20 text-monitor-status-operational">
      <CheckCircle />
      <AlertTitle>All Systems Operational</AlertTitle>
      <AlertDescription>
        Last Updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
      </AlertDescription>
    </Alert>
  );
}

export default MonitorsOverview;
