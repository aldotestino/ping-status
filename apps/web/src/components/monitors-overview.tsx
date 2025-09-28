import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { client } from "@/lib/orpc";

type MonitorsOverviewProps = Awaited<ReturnType<typeof client.overview>>;

function MonitorsOverview({ down, total, lastUpdated }: MonitorsOverviewProps) {
  if (down >= 1) {
    return (
      <Alert className="border-monitor-status-down/50 bg-monitor-status-down/30">
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
    <Alert className="border-monitor-status-operational/50 bg-monitor-status-operational/30">
      <CheckCircle />
      <AlertTitle>All Systems Operational</AlertTitle>
      <AlertDescription>
        Last Updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
      </AlertDescription>
    </Alert>
  );
}

export default MonitorsOverview;
