import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import CopyButton from "@/components/copy-button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { client } from "@/lib/orpc";
import { cn, getStatusBadge } from "@/lib/utils";

type MonitorsOverviewProps = Awaited<ReturnType<typeof client.overview>>;

function MonitorsOverview({
  down,
  monitors,
  degraded,
  lastUpdated,
}: MonitorsOverviewProps) {
  return (
    <Item variant="muted">
      <ItemMedia
        className={cn({
          "text-monitor-status-operational": down.length === 0,
          "text-monitor-status-degraded": degraded.length >= 1,
          "text-monitor-status-down": down.length >= 1,
        })}
      >
        {degraded.length >= 1 ? (
          <AlertTriangle />
          // biome-ignore lint/style/noNestedTernary: ok
        ) : down.length >= 1 ? (
          <AlertCircle />
        ) : (
          <CheckCircle />
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle
          className={cn("text-base", {
            "text-monitor-status-operational": down.length === 0,
            "text-monitor-status-degraded": degraded.length >= 1,
            "text-monitor-status-down": down.length >= 1,
          })}
        >
          {down.length >= 1
            ? `Downtime (${down.length}/${monitors.length})`
            : // biome-ignore lint/style/noNestedTernary: ok
              degraded.length >= 1
              ? `Degraded (${degraded.length}/${monitors.length})`
              : "All Systems Operational"}
        </ItemTitle>
        <ItemDescription>
          {format(lastUpdated, "MMM d, yyyy 'at' HH:mm")} (
          {formatDistanceToNow(lastUpdated, { addSuffix: true })})
        </ItemDescription>
      </ItemContent>
      <ItemActions className="hidden md:block">
        <CopyButton value={getStatusBadge()} variant="outline">
          Get Status Badge
        </CopyButton>
      </ItemActions>
      <ItemFooter className="md:hidden">
        <CopyButton
          className="w-full"
          value={getStatusBadge()}
          variant="outline"
        >
          Get Status Badge
        </CopyButton>
      </ItemFooter>
    </Item>
  );
}

export default MonitorsOverview;
