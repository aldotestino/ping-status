import { CheckCircle, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { client } from "@/lib/orpc";

type MonitorsOverviewProps = Awaited<ReturnType<typeof client.overview>>;

function MonitorsOverview({ down, operational, total }: MonitorsOverviewProps) {
  if (down >= 1) {
    return (
      <Alert>
        <TriangleAlert />
        <AlertTitle>Downtime</AlertTitle>
        <AlertDescription>
          {down}/{total} monitors are down
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <CheckCircle />
      <AlertTitle>All Systems Operational</AlertTitle>
      <AlertDescription>
        {operational}/{total} monitors are operational
      </AlertDescription>
    </Alert>
  );
}

export default MonitorsOverview;
